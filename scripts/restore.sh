#!/bin/bash

# ==========================================
# Database Restore Script
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Restore${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

BACKUP_DIR="./backups"

# List available backups
echo "Available backups:"
ls -lh $BACKUP_DIR/antiq_backup_*.sql.gz 2>/dev/null || {
    echo -e "${RED}No backups found in $BACKUP_DIR${NC}"
    exit 1
}
echo ""

# Ask for backup file
read -p "Enter backup filename: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_DIR/$BACKUP_FILE${NC}"
    exit 1
fi

# Confirm restore
echo -e "${RED}WARNING: This will replace the current database!${NC}"
read -p "Are you sure you want to restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo -e "${YELLOW}Decompressing backup...${NC}"
gunzip -c "$BACKUP_DIR/$BACKUP_FILE" > /tmp/restore.sql

echo -e "${YELLOW}Stopping API service...${NC}"
docker compose -f docker-compose.production.yml stop api

echo -e "${YELLOW}Restoring database...${NC}"
docker compose -f docker-compose.production.yml exec -T postgres \
    psql -U postgres -p 5433 -d antiq_production < /tmp/restore.sql

# Cleanup
rm /tmp/restore.sql

echo -e "${YELLOW}Starting API service...${NC}"
docker compose -f docker-compose.production.yml start api

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Restore Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
