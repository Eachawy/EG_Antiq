#!/bin/bash

################################################################################
# Quick Rebuild Production API Script
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "Rebuilding production API..."

# Build the application
log_info "Building application..."
pnpm build

if [ $? -ne 0 ]; then
    log_error "Build failed"
    exit 1
fi

# Stop and rebuild API container
log_info "Stopping API container..."
docker compose -f docker-compose.production.yml down api

log_info "Rebuilding and starting API container..."
docker compose -f docker-compose.production.yml up -d --build api

# Wait for API to be healthy
log_info "Waiting for API to start..."
sleep 10

# Check status
API_CONTAINER=$(docker ps --filter "name=api" --format "{{.Names}}" | head -1)

if [ -n "$API_CONTAINER" ]; then
    log_success "API container: $API_CONTAINER"
    log_info "Checking logs..."
    docker logs "$API_CONTAINER" --tail 20
else
    log_error "API container not found"
    exit 1
fi

log_success "Production API rebuilt successfully!"
echo ""
log_info "Monitor logs with:"
echo "  docker compose -f docker-compose.production.yml logs -f api"
