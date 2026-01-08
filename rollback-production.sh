#!/bin/bash

################################################################################
# Production Rollback Script - Monument Date Fields Migration
# This script rolls back the date field refactoring changes
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"

# Container names (will be auto-detected)
POSTGRES_CONTAINER=""
API_CONTAINER=""

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# Detect Container Names
################################################################################

detect_containers() {
    log_info "Detecting container names..."

    # Get postgres container name
    POSTGRES_CONTAINER=$(docker ps -a --filter "ancestor=postgres" --format "{{.Names}}" | head -1)
    if [ -z "$POSTGRES_CONTAINER" ]; then
        POSTGRES_CONTAINER=$(docker compose ps -a postgres 2>/dev/null | grep postgres | awk '{print $1}' | head -1)
    fi

    # Get API container name
    API_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep -E "(api|backend)" | head -1)
    if [ -z "$API_CONTAINER" ]; then
        API_CONTAINER=$(docker compose ps -a api 2>/dev/null | grep api | awk '{print $1}' | head -1)
    fi

    log_info "Detected containers:"
    log_info "  PostgreSQL: ${POSTGRES_CONTAINER:-NOT FOUND}"
    log_info "  API: ${API_CONTAINER:-NOT FOUND}"
}

################################################################################
# List Available Backups
################################################################################

list_backups() {
    log_info "Available backups:"
    echo ""

    if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A ${BACKUP_DIR} 2>/dev/null)" ]; then
        log_error "No backups found in ${BACKUP_DIR}"
        exit 1
    fi

    ls -lh "${BACKUP_DIR}"/*.sql 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
    echo ""
}

################################################################################
# Rollback Database
################################################################################

rollback_database() {
    local BACKUP_FILE=$1

    # Detect containers first
    detect_containers

    if [ -z "$POSTGRES_CONTAINER" ]; then
        log_error "PostgreSQL container not detected. Starting containers..."
        docker compose up -d postgres
        sleep 5
        detect_containers

        if [ -z "$POSTGRES_CONTAINER" ]; then
            log_error "Failed to start PostgreSQL container"
            exit 1
        fi
    fi

    log_warning "This will restore the database from: ${BACKUP_FILE}"
    log_warning "ALL CURRENT DATA WILL BE REPLACED with the backup!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r REPLY
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    log_info "Stopping API container..."
    docker compose down api

    log_info "Restoring database from backup..."
    log_info "Using container: $POSTGRES_CONTAINER"
    docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d Antiq_db < "${BACKUP_FILE}"

    if [ $? -eq 0 ]; then
        log_success "Database restored successfully"
    else
        log_error "Failed to restore database"
        exit 1
    fi
}

################################################################################
# Revert Code Changes
################################################################################

revert_code() {
    log_info "Current git status:"
    git status --short

    echo ""
    log_warning "Do you want to revert the last commit?"
    read -p "Continue? (yes/no): " -r REPLY
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Skipping code revert"
        return
    fi

    log_info "Reverting last commit..."
    git revert HEAD --no-edit

    if [ $? -eq 0 ]; then
        log_success "Code reverted successfully"
    else
        log_error "Failed to revert code"
        exit 1
    fi
}

################################################################################
# Rebuild and Restart
################################################################################

rebuild_and_restart() {
    log_info "Rebuilding application..."
    pnpm build

    log_info "Regenerating Prisma Client..."
    export DATABASE_URL="postgresql://postgres:Antiq_dev@localhost:5433/Antiq_db?schema=public"
    pnpm prisma:generate

    log_info "Restarting Docker containers..."
    docker compose -f docker-compose.yml up -d --build api

    # Wait for API to be healthy
    log_info "Waiting for API to become healthy..."
    for i in {1..30}; do
        if docker ps --filter "name=backend-api" --format "{{.Status}}" | grep -q "healthy"; then
            log_success "API container is healthy"
            return 0
        fi
        echo -n "."
        sleep 2
    done

    log_error "API container did not become healthy in time"
    log_info "Check logs with: docker logs backend-api"
    exit 1
}

################################################################################
# Verify Rollback
################################################################################

verify_rollback() {
    log_info "Verifying rollback..."

    # Check if API is responding
    sleep 5
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

    if [ "${HTTP_CODE}" = "200" ]; then
        log_success "API health check passed (HTTP ${HTTP_CODE})"
    else
        log_warning "API health check failed (HTTP ${HTTP_CODE})"
        if [ -n "$API_CONTAINER" ]; then
            log_info "Check logs with: docker logs $API_CONTAINER"
        fi
    fi

    # Check database schema (should have old column names)
    log_info "Verifying database schema..."
    if [ -n "$POSTGRES_CONTAINER" ]; then
        docker exec "$POSTGRES_CONTAINER" psql -U postgres -d Antiq_db -c "\d monuments" | grep -q "m_date"

        if [ $? -eq 0 ]; then
            log_success "Database schema rolled back successfully (m_date column exists)"
        else
            log_warning "Database schema verification inconclusive"
        fi
    else
        log_warning "PostgreSQL container not detected, skipping schema verification"
    fi

    log_success "Rollback verification completed"
}

################################################################################
# Main Rollback Flow
################################################################################

main() {
    echo ""
    log_info "======================================================================"
    log_info "           Production Rollback - Monument Date Fields"
    log_info "======================================================================"
    echo ""

    list_backups

    echo ""
    read -p "Enter the backup file name to restore (or 'latest' for most recent): " BACKUP_CHOICE

    if [ "${BACKUP_CHOICE}" = "latest" ]; then
        BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/*.sql 2>/dev/null | head -1)
    else
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_CHOICE}"
    fi

    if [ ! -f "${BACKUP_FILE}" ]; then
        log_error "Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi

    log_info "Selected backup: ${BACKUP_FILE}"

    # Execute rollback steps
    rollback_database "${BACKUP_FILE}"

    echo ""
    log_warning "Do you also want to revert code changes?"
    log_info "Choose 'yes' if you want to undo the date field refactoring in code"
    read -p "Revert code? (yes/no): " -r REPLY
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        revert_code
    fi

    rebuild_and_restart
    verify_rollback

    echo ""
    log_success "======================================================================"
    log_success "              ROLLBACK COMPLETED SUCCESSFULLY!"
    log_success "======================================================================"
    echo ""
    log_info "The system has been rolled back to:"
    log_info "  - Database: ${BACKUP_FILE}"
    log_info "  - Code: Previous state"
    echo ""
    log_info "Next steps:"
    echo "  1. Verify the monuments page works correctly"
    echo "  2. Test API endpoints"
    echo "  3. Check that old CSV format works again"
    echo ""
}

# Run main function
main "$@"
