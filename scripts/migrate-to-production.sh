#!/bin/bash

# ==========================================
# Migrate Local Database to Production
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Migration Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Configuration
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5433"
LOCAL_DB_NAME="Antiq_db"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="Antiq_dev"

PRODUCTION_SERVER="153.92.209.167"
PRODUCTION_USER="root"
BACKUP_FILE="production_backup_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${BLUE}Step 1: Dumping local database...${NC}"
# Use Docker to run pg_dump if local pg_dump not available
if command -v pg_dump &> /dev/null; then
  PGPASSWORD=$LOCAL_DB_PASSWORD pg_dump \
    -h $LOCAL_DB_HOST \
    -p $LOCAL_DB_PORT \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    > /tmp/$BACKUP_FILE
else
  # Use Docker container to dump
  echo -e "${YELLOW}  Using Docker to dump database...${NC}"
  docker exec backend-postgres pg_dump \
    -U $LOCAL_DB_USER \
    -d $LOCAL_DB_NAME \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    > /tmp/$BACKUP_FILE
fi

echo -e "${GREEN}✓ Local database dumped to /tmp/$BACKUP_FILE${NC}"
FILE_SIZE=$(du -h /tmp/$BACKUP_FILE | cut -f1)
echo -e "${BLUE}  File size: $FILE_SIZE${NC}"
echo ""

echo -e "${BLUE}Step 2: Transferring backup to production server...${NC}"
scp -o PreferredAuthentications=password /tmp/$BACKUP_FILE $PRODUCTION_USER@$PRODUCTION_SERVER:/tmp/$BACKUP_FILE

echo -e "${GREEN}✓ Backup transferred to production server${NC}"
echo ""

echo -e "${BLUE}Step 3: Restoring database on production server...${NC}"
ssh -o PreferredAuthentications=password $PRODUCTION_USER@$PRODUCTION_SERVER << ENDSSH
cd /root/EG_Antiq

echo "Stopping API container..."
docker compose -f docker-compose.production.yml stop api
sleep 3

echo "Restoring database..."
cat /tmp/$BACKUP_FILE | docker compose -f docker-compose.production.yml exec -T postgres psql \
  -U postgres \
  -p 5433 \
  -d antiq_production

echo "Starting API container..."
docker compose -f docker-compose.production.yml start api
sleep 5

echo "Checking API health..."
docker compose -f docker-compose.production.yml ps api

echo "Cleaning up backup file..."
rm /tmp/$BACKUP_FILE

echo "Done!"
ENDSSH

echo -e "${GREEN}✓ Database restored on production${NC}"
echo ""

echo -e "${BLUE}Step 4: Cleaning up local backup...${NC}"
rm /tmp/$BACKUP_FILE
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "1. Your local database has been migrated to production"
echo -e "2. All existing production data has been replaced"
echo -e "3. Login credentials are now the same as your local database"
echo ""
echo -e "${YELLOW}Test the migration:${NC}"
echo -e "Visit: ${BLUE}http://153.92.209.167:3001${NC}"
echo -e "Or test API: ${BLUE}curl http://153.92.209.167:3000/api/v1/health${NC}"
echo ""
