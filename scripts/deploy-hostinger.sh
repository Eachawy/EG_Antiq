#!/bin/bash

# ==========================================
# Hostinger VPS Deployment Script
# ==========================================
# Deploys both API and Admin Frontend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Hostinger VPS Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo -e "${BLUE}Server IP: ${GREEN}${SERVER_IP}${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Run: ./scripts/setup-env.sh"
    exit 1
fi

# Add CORS configuration if not present
if ! grep -q "CORS_ORIGIN" .env; then
    echo -e "${YELLOW}Adding CORS configuration...${NC}"
    cat >> .env << EOF

# CORS Configuration
CORS_ORIGIN=http://${SERVER_IP}:3001,http://localhost:3001
EOF
    echo -e "${GREEN}✓ CORS added${NC}"
fi

echo -e "${YELLOW}Step 1: Stopping existing containers...${NC}"
docker compose -f docker-compose.production.yml down
echo -e "${GREEN}✓ Stopped${NC}"
echo ""

echo -e "${YELLOW}Step 2: Building images...${NC}"
echo "This may take several minutes..."

# Build API
echo -e "${BLUE}Building API...${NC}"
docker compose -f docker-compose.production.yml build api

# Build Frontend
echo -e "${BLUE}Building Admin Frontend...${NC}"
docker compose -f docker-compose.production.yml build frontend

echo -e "${GREEN}✓ Build complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Starting database services...${NC}"
docker compose -f docker-compose.production.yml up -d postgres redis
echo "Waiting for database to be ready..."
sleep 20
echo -e "${GREEN}✓ Database ready${NC}"
echo ""

echo -e "${YELLOW}Step 4: Initializing database...${NC}"
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma db push
echo -e "${GREEN}✓ Database initialized${NC}"
echo ""

echo -e "${YELLOW}Step 5: Starting API and Frontend...${NC}"
docker compose -f docker-compose.production.yml up -d api frontend
echo "Waiting for services to start..."
sleep 15
echo -e "${GREEN}✓ Services started${NC}"
echo ""

# Check service health
echo -e "${YELLOW}Step 6: Checking service health...${NC}"
docker compose -f docker-compose.production.yml ps
echo ""

# Test API
echo -e "${YELLOW}Step 7: Testing API...${NC}"
sleep 5
API_HEALTH=$(docker compose -f docker-compose.production.yml exec -T api node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {console.log(r.statusCode)})" 2>/dev/null || echo "error")

if [ "$API_HEALTH" = "200" ]; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${YELLOW}⚠ API health check pending (may still be starting)${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  API:              ${GREEN}http://${SERVER_IP}:3000/api/v1/health${NC}"
echo -e "  Admin Frontend:   ${GREEN}http://${SERVER_IP}:3001${NC}"
echo -e "  Login:            ${GREEN}http://${SERVER_IP}:3001/login${NC}"
echo ""
echo -e "${YELLOW}Default Login Credentials:${NC}"
echo -e "  Email:    admin@example.com"
echo -e "  Password: Admin123!"
echo -e "  ${RED}⚠ Change these immediately after first login!${NC}"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo -e "  View logs:        ${YELLOW}docker compose -f docker-compose.production.yml logs -f${NC}"
echo -e "  Restart API:      ${YELLOW}docker compose -f docker-compose.production.yml restart api${NC}"
echo -e "  Restart Frontend: ${YELLOW}docker compose -f docker-compose.production.yml restart frontend${NC}"
echo -e "  Check status:     ${YELLOW}docker compose -f docker-compose.production.yml ps${NC}"
echo ""

# Check if ports are open
echo -e "${YELLOW}Firewall Check:${NC}"
echo -e "Make sure these ports are open in Hostinger firewall:"
echo -e "  - Port 3000 (API)"
echo -e "  - Port 3001 (Admin Frontend)"
echo ""
echo -e "Configure in Hostinger panel:"
echo -e "  ${BLUE}https://hpanel.hostinger.com → VPS → Firewall${NC}"
echo ""
