#!/bin/bash

##############################################################################
# Production Deployment Script for EG Antiq API Backend
#
# SAFETY: This script PRESERVES all database data and volumes
# Usage: ./deploy-production.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="EG_Antiq_API"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  EG Antiq API - Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ] && ! groups | grep -q docker; then
    echo -e "${YELLOW}Warning: Not running as root or in docker group. You may need sudo.${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file with production configuration."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed!${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Step 1: Pulling latest code from repository...${NC}"
git fetch origin
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
git pull origin "$CURRENT_BRANCH"
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Backing up current container state...${NC}"
docker compose ps > "$BACKUP_DIR/containers_state_$TIMESTAMP.txt"
echo -e "${GREEN}✓ Container state backed up to $BACKUP_DIR/containers_state_$TIMESTAMP.txt${NC}"
echo ""

echo -e "${YELLOW}Step 3: Creating database backup...${NC}"
# Backup database (IMPORTANT: Preserves all data)
POSTGRES_CONTAINER=$(docker compose ps -q postgres)
if [ -n "$POSTGRES_CONTAINER" ]; then
    # Auto-detect database name by checking which one exists
    echo "Detecting database name..."
    if docker exec "$POSTGRES_CONTAINER" psql -U postgres -lqt | cut -d \| -f 1 | grep -qw antiq_production; then
        DB_NAME="antiq_production"
    elif docker exec "$POSTGRES_CONTAINER" psql -U postgres -lqt | cut -d \| -f 1 | grep -qw Antiq_db; then
        DB_NAME="Antiq_db"
    else
        echo -e "${RED}Error: No Antiq database found!${NC}"
        exit 1
    fi

    echo "Backing up database: $DB_NAME"
    docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres -d "$DB_NAME" > "$BACKUP_DIR/database_$TIMESTAMP.sql"
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/database_$TIMESTAMP.sql" | cut -f1)
    echo -e "${GREEN}✓ Database backed up: $BACKUP_DIR/database_$TIMESTAMP.sql ($BACKUP_SIZE)${NC}"
else
    echo -e "${YELLOW}! PostgreSQL container not running, skipping database backup${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Building new Docker images...${NC}"
echo "This may take a few minutes..."
docker compose build api --no-cache
echo -e "${GREEN}✓ Docker images built${NC}"
echo ""

echo -e "${YELLOW}Step 5: Stopping API container (preserving database & volumes)...${NC}"
# IMPORTANT: Only stop the API container, NOT the database or redis
# Do NOT use "docker compose down" which would remove volumes
docker compose stop api
echo -e "${GREEN}✓ API container stopped${NC}"
echo ""

echo -e "${YELLOW}Step 6: Starting updated API container...${NC}"
docker compose up -d api
echo -e "${GREEN}✓ API container started${NC}"
echo ""

echo -e "${YELLOW}Step 7: Waiting for API to be ready...${NC}"
sleep 10

# Health check
MAX_RETRIES=30
RETRY_COUNT=0
until [ $RETRY_COUNT -ge $MAX_RETRIES ]
do
    if curl -f http://localhost:3000/api/v1/health &> /dev/null; then
        echo -e "${GREEN}✓ API is healthy!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "Waiting for API to be ready... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo -e "${RED}Error: API failed to start properly!${NC}"
    echo "Check logs with: docker compose logs api"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 8: Checking container status...${NC}"
docker compose ps
echo ""

echo -e "${YELLOW}Step 9: Recent logs...${NC}"
docker compose logs --tail=30 api
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "API is now running with the latest code."
echo "Database and all data have been preserved."
echo ""
echo "Backup location: $BACKUP_DIR/database_$TIMESTAMP.sql"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f api"
echo "  - Check status: docker compose ps"
echo "  - Restart: docker compose restart api"
echo ""
echo "Rollback instructions (if needed):"
echo "  1. Stop API: docker compose stop api"
echo "  2. Restore DB: docker exec -i \$(docker compose ps -q postgres) psql -U postgres -d $DB_NAME < $BACKUP_DIR/database_$TIMESTAMP.sql"
echo "  3. Revert code: git checkout <previous-commit>"
echo "  4. Rebuild: docker compose build api && docker compose up -d api"
echo ""
echo -e "${BLUE}Deployment completed at: $(date)${NC}"
