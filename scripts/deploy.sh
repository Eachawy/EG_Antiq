#!/bin/bash

# ==========================================
# Production Deployment Script
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Ancient Egypt Portal - Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.production.example to .env and configure it."
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
REQUIRED_VARS=("DATABASE_PASSWORD" "JWT_SECRET" "PORTAL_JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Step 1: Creating required directories...${NC}"
mkdir -p backups
mkdir -p certs
mkdir -p certbot-www
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Building Docker images...${NC}"
docker compose -f docker-compose.production.yml build --no-cache
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Stopping existing containers...${NC}"
docker compose -f docker-compose.production.yml down
echo -e "${GREEN}✓ Stopped${NC}"
echo ""

echo -e "${YELLOW}Step 4: Starting services...${NC}"
docker compose -f docker-compose.production.yml up -d postgres redis
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma migrate deploy
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# Start remaining services
echo -e "${YELLOW}Step 6: Starting API and Nginx...${NC}"
docker compose -f docker-compose.production.yml up -d api nginx
echo -e "${GREEN}✓ All services started${NC}"
echo ""

# Wait for health checks
echo -e "${YELLOW}Step 7: Waiting for health checks...${NC}"
sleep 15

# Check service health
echo "Checking service status..."
docker compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Application is running at: ${GREEN}http://localhost${NC}"
echo -e "API Health: ${GREEN}http://localhost/api/v1/health${NC}"
echo ""
echo "View logs with: ./scripts/logs.sh"
echo "Setup SSL with: ./scripts/setup-ssl.sh"
echo ""
