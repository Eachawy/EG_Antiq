#!/bin/bash

# ==========================================
# Update CORS Origins for kemetra.org
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Update CORS Origins${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please run setup-env.sh first${NC}"
    exit 1
fi

# Get current server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo -e "${BLUE}Updating CORS_ORIGINS in .env...${NC}"

# New CORS origins including kemetra.org domain
NEW_CORS="http://admin.kemetra.org,https://admin.kemetra.org,http://api.kemetra.org,https://api.kemetra.org,http://localhost:3001,http://${SERVER_IP}:3001,http://localhost:3002,http://${SERVER_IP}:3002"

# Check if CORS_ORIGINS exists
if grep -q "^CORS_ORIGINS=" .env; then
    # Update existing
    sed -i.bak "s|^CORS_ORIGINS=.*|CORS_ORIGINS=${NEW_CORS}|" .env
    echo -e "${GREEN}✓ CORS_ORIGINS updated${NC}"
else
    # Add new
    echo "" >> .env
    echo "# CORS Configuration" >> .env
    echo "CORS_ORIGINS=${NEW_CORS}" >> .env
    echo -e "${GREEN}✓ CORS_ORIGINS added${NC}"
fi

echo ""
echo -e "${BLUE}Current CORS configuration:${NC}"
grep "^CORS_ORIGINS=" .env | sed 's/CORS_ORIGINS=//'

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CORS Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next step: Restart the API${NC}"
echo -e "Run: ${BLUE}docker compose -f docker-compose.production.yml restart api${NC}"
echo ""
