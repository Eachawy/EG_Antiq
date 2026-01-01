#!/bin/bash

# ==========================================
# Database Backup Script
# ==========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Database Backup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/antiq_backup_$TIMESTAMP.sql"

echo -e "${YELLOW}Creating backup...${NC}"

# Execute backup
docker compose -f docker-compose.production.yml exec -T postgres \
    pg_dump -U postgres -p 5433 antiq_production > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"
echo ""

# Show backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo -e "Backup size: ${GREEN}$BACKUP_SIZE${NC}"
echo ""

# Keep only last 7 backups
echo -e "${YELLOW}Cleaning old backups (keeping last 7)...${NC}"
cd $BACKUP_DIR
ls -t antiq_backup_*.sql.gz | tail -n +8 | xargs -r rm
cd ..

echo -e "${GREEN}Backup complete!${NC}"

# Show all backups
echo ""
echo "Available backups:"
ls -lh $BACKUP_DIR/antiq_backup_*.sql.gz 2>/dev/null || echo "No backups found"
