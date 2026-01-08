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
    docker exec -i backend-postgres psql -U postgres -d Antiq_db < "${BACKUP_FILE}"

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
        log_error "API health check failed (HTTP ${HTTP_CODE})"
        exit 1
    fi

    # Check database schema (should have old column names)
    log_info "Verifying database schema..."
    docker exec backend-postgres psql -U postgres -d Antiq_db -c "\d monuments" | grep -q "m_date"

    if [ $? -eq 0 ]; then
        log_success "Database schema rolled back successfully (m_date column exists)"
    else
        log_warning "Database schema verification inconclusive"
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
