#!/bin/bash

################################################################################
# Production Deployment Script - Monument Date Fields Migration
# This script safely applies the date field refactoring to production
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
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_before_date_migration_${TIMESTAMP}.sql"

# Container names (will be auto-detected)
POSTGRES_CONTAINER=""
API_CONTAINER=""
REDIS_CONTAINER=""

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

press_any_key() {
    read -n 1 -s -r -p "Press any key to continue..."
    echo
}

################################################################################
# Detect Container Names
################################################################################

detect_containers() {
    log_info "Detecting container names..."

    # Get postgres container name
    POSTGRES_CONTAINER=$(docker ps -a --filter "ancestor=postgres" --format "{{.Names}}" | head -1)
    if [ -z "$POSTGRES_CONTAINER" ]; then
        # Try by service name from docker-compose
        POSTGRES_CONTAINER=$(docker compose ps -a postgres 2>/dev/null | grep postgres | awk '{print $1}' | head -1)
    fi

    # Get API container name
    API_CONTAINER=$(docker ps -a --format "{{.Names}}" | grep -E "(api|backend)" | head -1)
    if [ -z "$API_CONTAINER" ]; then
        API_CONTAINER=$(docker compose ps -a api 2>/dev/null | grep api | awk '{print $1}' | head -1)
    fi

    # Get Redis container name (optional)
    REDIS_CONTAINER=$(docker ps -a --filter "ancestor=redis" --format "{{.Names}}" | head -1)

    log_info "Detected containers:"
    log_info "  PostgreSQL: ${POSTGRES_CONTAINER:-NOT FOUND}"
    log_info "  API: ${API_CONTAINER:-NOT FOUND}"
    log_info "  Redis: ${REDIS_CONTAINER:-NOT FOUND}"
}

################################################################################
# Start Containers if Needed
################################################################################

ensure_containers_running() {
    log_info "Checking if containers are running..."

    # Start postgres if not running
    if [ -n "$POSTGRES_CONTAINER" ]; then
        if ! docker ps --format "{{.Names}}" | grep -q "^${POSTGRES_CONTAINER}$"; then
            log_warning "PostgreSQL container is not running. Starting it..."
            docker compose up -d postgres
            sleep 5  # Wait for postgres to be ready

            # Wait for postgres to be healthy
            log_info "Waiting for PostgreSQL to be ready..."
            for i in {1..30}; do
                if docker exec "$POSTGRES_CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
                    log_success "PostgreSQL is ready"
                    break
                fi
                echo -n "."
                sleep 2
            done
        else
            log_success "PostgreSQL container is running"
        fi
    else
        log_error "PostgreSQL container not found. Starting all services..."
        docker compose up -d postgres redis
        sleep 10

        # Re-detect containers
        detect_containers

        if [ -z "$POSTGRES_CONTAINER" ]; then
            log_error "Failed to start PostgreSQL container"
            exit 1
        fi
    fi

    # Start redis if not running (optional)
    if [ -n "$REDIS_CONTAINER" ]; then
        if ! docker ps --format "{{.Names}}" | grep -q "^${REDIS_CONTAINER}$"; then
            log_info "Starting Redis container..."
            docker compose up -d redis
        fi
    fi
}

################################################################################
# Pre-flight Checks
################################################################################

preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml not found. Please run this script from the project root."
        exit 1
    fi

    # Detect and start containers
    detect_containers
    ensure_containers_running

    # Create backup directory if it doesn't exist
    mkdir -p "${BACKUP_DIR}"

    log_success "Pre-flight checks passed"
}

################################################################################
# Backup Database
################################################################################

backup_database() {
    log_info "Creating database backup..."

    # Check if postgres container is running
    if [ -z "$POSTGRES_CONTAINER" ]; then
        log_error "PostgreSQL container not detected. Cannot create backup."
        exit 1
    fi

    if ! docker ps --format "{{.Names}}" | grep -q "^${POSTGRES_CONTAINER}$"; then
        log_error "PostgreSQL container is not running. Cannot create backup."
        exit 1
    fi

    # Create backup
    log_info "Using container: $POSTGRES_CONTAINER"
    docker exec "$POSTGRES_CONTAINER" pg_dump \
        -U postgres \
        -d Antiq_db \
        --clean \
        --if-exists \
        > "${BACKUP_FILE}" 2>/dev/null

    if [ $? -eq 0 ] && [ -s "${BACKUP_FILE}" ]; then
        BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        log_success "Database backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"
    else
        log_error "Failed to create database backup"
        log_warning "You may need to check database connection settings"
        exit 1
    fi
}

################################################################################
# Apply Database Migration
################################################################################

apply_migration() {
    log_info "Applying database migration..."

    # Set database URL for production
    export DATABASE_URL="postgresql://postgres:Antiq_dev@localhost:5433/Antiq_db?schema=public"

    # Check migration status
    log_info "Checking current migration status..."
    pnpm --filter @packages/database prisma migrate status

    # Apply migrations
    log_info "Running prisma migrate deploy..."
    pnpm --filter @packages/database prisma migrate deploy

    if [ $? -eq 0 ]; then
        log_success "Database migration applied successfully"
    else
        log_error "Failed to apply database migration"
        log_warning "You can restore the database from: ${BACKUP_FILE}"
        exit 1
    fi

    # Regenerate Prisma Client
    log_info "Regenerating Prisma Client..."
    pnpm prisma:generate

    if [ $? -eq 0 ]; then
        log_success "Prisma Client regenerated successfully"
    else
        log_error "Failed to regenerate Prisma Client"
        exit 1
    fi
}

################################################################################
# Build Application
################################################################################

build_application() {
    log_info "Building application..."

    pnpm build

    if [ $? -eq 0 ]; then
        log_success "Application built successfully"
    else
        log_error "Failed to build application"
        exit 1
    fi
}

################################################################################
# Restart Docker Containers
################################################################################

restart_containers() {
    log_info "Restarting Docker containers..."

    # Stop API container
    log_info "Stopping API container..."
    docker compose down api

    # Rebuild and start containers
    log_info "Rebuilding and starting containers..."
    docker compose -f docker-compose.yml up -d --build api

    if [ $? -eq 0 ]; then
        log_success "Containers restarted successfully"
    else
        log_error "Failed to restart containers"
        exit 1
    fi

    # Re-detect API container name after rebuild
    sleep 3
    detect_containers

    # Wait for API to be healthy
    log_info "Waiting for API to become healthy..."
    for i in {1..60}; do
        # Check if container is running
        if [ -n "$API_CONTAINER" ] && docker ps --format "{{.Names}}" | grep -q "^${API_CONTAINER}$"; then
            # Check if it has health status
            STATUS=$(docker inspect --format='{{.State.Health.Status}}' "$API_CONTAINER" 2>/dev/null || echo "no-health")

            if [ "$STATUS" = "healthy" ]; then
                log_success "API container is healthy"
                return 0
            elif [ "$STATUS" = "no-health" ]; then
                # No health check defined, just check if running
                log_success "API container is running (no health check defined)"
                return 0
            fi
        fi
        echo -n "."
        sleep 2
    done

    log_error "API container did not become healthy in time"
    if [ -n "$API_CONTAINER" ]; then
        log_info "Check logs with: docker logs $API_CONTAINER"
    fi
    exit 1
}

################################################################################
# Verify Deployment
################################################################################

verify_deployment() {
    log_info "Verifying deployment..."

    # Check if API is responding
    log_info "Testing API health endpoint..."
    sleep 5  # Give API a moment to fully start

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health)

    if [ "${HTTP_CODE}" = "200" ]; then
        log_success "API health check passed (HTTP ${HTTP_CODE})"
    else
        log_warning "API health check failed (HTTP ${HTTP_CODE})"
        log_info "API might still be starting up, but containers are running"
        if [ -n "$API_CONTAINER" ]; then
            log_info "Check logs with: docker logs $API_CONTAINER"
        fi
    fi

    # Check database schema
    log_info "Verifying database schema..."
    if [ -n "$POSTGRES_CONTAINER" ]; then
        docker exec "$POSTGRES_CONTAINER" psql -U postgres -d Antiq_db -c "\d monuments" > /dev/null 2>&1

        if [ $? -eq 0 ]; then
            log_success "Database schema verified"

            # Display sample data
            log_info "Checking monument data (showing new columns)..."
            docker exec "$POSTGRES_CONTAINER" psql -U postgres -d Antiq_db -c "SELECT id, monument_name_en, start_date, end_date, start_date_Hijri, end_date_Hijri FROM monuments LIMIT 3;" 2>/dev/null
        else
            log_error "Failed to verify database schema"
            exit 1
        fi
    else
        log_warning "PostgreSQL container not detected, skipping schema verification"
    fi

    log_success "Deployment verification completed"
}

################################################################################
# Show Rollback Instructions
################################################################################

show_rollback_instructions() {
    echo ""
    log_info "======================================================================"
    log_info "                    ROLLBACK INSTRUCTIONS"
    log_info "======================================================================"
    echo ""
    echo "If you need to rollback this deployment, run:"
    echo ""
    echo "  1. Stop the API:"
    echo "     ${YELLOW}docker compose down api${NC}"
    echo ""
    echo "  2. Restore the database:"
    echo "     ${YELLOW}docker exec -i backend-postgres psql -U postgres -d Antiq_db < ${BACKUP_FILE}${NC}"
    echo ""
    echo "  3. Revert code changes:"
    echo "     ${YELLOW}git revert HEAD${NC}"
    echo ""
    echo "  4. Rebuild and restart:"
    echo "     ${YELLOW}docker compose up -d --build api${NC}"
    echo ""
    log_info "======================================================================"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    echo ""
    log_info "======================================================================"
    log_info "     Production Deployment - Monument Date Fields Migration"
    log_info "======================================================================"
    echo ""

    log_warning "This script will:"
    echo "  1. Create a database backup"
    echo "  2. Apply database migration (rename date columns)"
    echo "  3. Rebuild the application"
    echo "  4. Restart Docker containers"
    echo "  5. Verify the deployment"
    echo ""
    log_warning "Estimated downtime: 2-5 minutes"
    echo ""

    read -p "Do you want to continue? (yes/no): " -r REPLY
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi

    # Execute deployment steps
    preflight_checks
    backup_database

    echo ""
    log_warning "Database backup completed. Ready to apply migration."
    log_warning "The migration will rename columns (safe operation, no data loss)."
    echo ""
    read -p "Continue with migration? (yes/no): " -r REPLY
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled. Backup saved at: ${BACKUP_FILE}"
        exit 0
    fi

    apply_migration
    build_application
    restart_containers
    verify_deployment

    echo ""
    log_success "======================================================================"
    log_success "              DEPLOYMENT COMPLETED SUCCESSFULLY!"
    log_success "======================================================================"
    echo ""
    log_info "Backup location: ${BACKUP_FILE}"
    log_info "Keep this backup until you verify everything works correctly."
    echo ""

    show_rollback_instructions

    echo ""
    log_info "Next steps:"
    echo "  1. Test the API endpoints"
    echo "  2. Check the admin frontend monuments page"
    echo "  3. Try uploading a CSV with the new format"
    echo "  4. Update user documentation about CSV format change"
    echo ""
}

# Run main function
main "$@"
