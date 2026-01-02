#!/bin/bash

# ==========================================
# Production Diagnostics Script
# ==========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Production Diagnostics${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if docker-compose file exists
if [ ! -f docker-compose.production.yml ]; then
    echo -e "${RED}Error: docker-compose.production.yml not found!${NC}"
    exit 1
fi

# 1. Check .env file
echo -e "${BLUE}1. Checking .env file...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"

    # Check required variables
    REQUIRED_VARS=("DATABASE_PASSWORD" "JWT_SECRET" "PORTAL_JWT_SECRET")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            echo -e "  ${GREEN}✓ ${var} is set${NC}"
        else
            echo -e "  ${RED}✗ ${var} is missing${NC}"
        fi
    done
else
    echo -e "${RED}✗ .env file not found!${NC}"
    echo -e "${YELLOW}Run: ./scripts/setup-env.sh${NC}"
fi
echo ""

# 2. Check Docker services status
echo -e "${BLUE}2. Docker Services Status:${NC}"
docker compose -f docker-compose.production.yml ps
echo ""

# 3. Check individual service health
echo -e "${BLUE}3. Service Health Checks:${NC}"

# PostgreSQL
echo -e "${YELLOW}PostgreSQL:${NC}"
if docker compose -f docker-compose.production.yml exec postgres pg_isready -U postgres -p 5433 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ PostgreSQL is ready${NC}"
else
    echo -e "  ${RED}✗ PostgreSQL is not ready${NC}"
fi

# Redis
echo -e "${YELLOW}Redis:${NC}"
if docker compose -f docker-compose.production.yml exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Redis is responding${NC}"
else
    echo -e "  ${RED}✗ Redis is not responding${NC}"
fi

# API
echo -e "${YELLOW}API:${NC}"
API_STATUS=$(docker inspect -f '{{.State.Status}}' production-api 2>/dev/null || echo "not found")
if [ "$API_STATUS" = "running" ]; then
    echo -e "  ${GREEN}✓ API container is running${NC}"

    # Check health endpoint
    if curl -sf http://localhost:3000/api/v1/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ API health endpoint responding${NC}"
    else
        echo -e "  ${YELLOW}⚠ API health endpoint not responding (may be starting up)${NC}"
    fi
else
    echo -e "  ${RED}✗ API container status: ${API_STATUS}${NC}"
fi
echo ""

# 4. Recent logs from each service
echo -e "${BLUE}4. Recent Logs:${NC}"

echo -e "${YELLOW}=== PostgreSQL Logs (last 10 lines) ===${NC}"
docker compose -f docker-compose.production.yml logs postgres --tail=10
echo ""

echo -e "${YELLOW}=== Redis Logs (last 10 lines) ===${NC}"
docker compose -f docker-compose.production.yml logs redis --tail=10
echo ""

echo -e "${YELLOW}=== API Logs (last 30 lines) ===${NC}"
docker compose -f docker-compose.production.yml logs api --tail=30
echo ""

# 5. Container restart counts
echo -e "${BLUE}5. Container Restart Counts:${NC}"
docker compose -f docker-compose.production.yml ps --format json | jq -r '.[] | "\(.Name): \(.Status)"' 2>/dev/null || docker compose -f docker-compose.production.yml ps
echo ""

# 6. Resource usage
echo -e "${BLUE}6. Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "Run: docker stats"
echo ""

# 7. Network connectivity
echo -e "${BLUE}7. Network Connectivity:${NC}"
echo -e "${YELLOW}Testing API -> PostgreSQL:${NC}"
docker compose -f docker-compose.production.yml exec -T api sh -c "nc -zv postgres 5433" 2>&1 | head -1 || echo "  Cannot test"

echo -e "${YELLOW}Testing API -> Redis:${NC}"
docker compose -f docker-compose.production.yml exec -T api sh -c "nc -zv redis 6379" 2>&1 | head -1 || echo "  Cannot test"
echo ""

# 8. Disk space
echo -e "${BLUE}8. Disk Space:${NC}"
df -h / | tail -1
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Diagnostic Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Common Issues:${NC}"
echo -e "1. ${RED}API Restarting?${NC} Check API logs: ${BLUE}docker compose -f docker-compose.production.yml logs api -f${NC}"
echo -e "2. ${RED}Database Error?${NC} Check connection: ${BLUE}docker compose -f docker-compose.production.yml exec postgres pg_isready -U postgres -p 5433${NC}"
echo -e "3. ${RED}Missing .env?${NC} Run: ${BLUE}./scripts/setup-env.sh${NC}"
echo -e "4. ${RED}Need to rebuild?${NC} Run: ${BLUE}docker compose -f docker-compose.production.yml build --no-cache${NC}"
echo ""
echo -e "${YELLOW}View Live Logs:${NC}"
echo -e "  All services: ${BLUE}docker compose -f docker-compose.production.yml logs -f${NC}"
echo -e "  API only: ${BLUE}docker compose -f docker-compose.production.yml logs -f api${NC}"
echo ""
