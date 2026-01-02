#!/bin/bash

# ==========================================
# View Docker Logs Script
# ==========================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Docker Logs Viewer${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if service name is provided
if [ -z "$1" ]; then
    echo "Available services:"
    echo -e "  ${YELLOW}all${NC}       - All services"
    echo -e "  ${YELLOW}api${NC}       - NestJS API"
    echo -e "  ${YELLOW}frontend${NC}  - React Frontend"
    echo -e "  ${YELLOW}nginx${NC}     - Nginx Reverse Proxy"
    echo -e "  ${YELLOW}postgres${NC}  - PostgreSQL Database"
    echo -e "  ${YELLOW}redis${NC}     - Redis Cache"
    echo ""
    echo "Usage: ./scripts/logs.sh [service] [options]"
    echo "Example: ./scripts/logs.sh api -f"
    echo "         ./scripts/logs.sh all --tail=100"
    exit 0
fi

SERVICE=$1
shift  # Remove first argument

if [ "$SERVICE" == "all" ]; then
    docker compose -f docker-compose.production.yml logs "$@"
else
    docker compose -f docker-compose.production.yml logs $SERVICE "$@"
fi
