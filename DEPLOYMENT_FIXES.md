# Deployment Scripts - Production Fixes

## Issue Fixed

The original deployment script was failing in production with error:
```
[ERROR] PostgreSQL container is not running. Cannot create backup.
```

## Root Cause

The scripts were hardcoded to look for container names `backend-postgres` and `backend-api`, but:
- Production containers might have different names
- Containers might not be running yet
- Docker Compose might use different naming conventions

## Solution Implemented

### 1. **Auto-Detection of Container Names**

Scripts now automatically detect container names using multiple methods:
- By Docker image ancestor (e.g., `postgres`, `redis`)
- By Docker Compose service name
- By name pattern matching (e.g., containers with "api" or "backend" in name)

```bash
# Example detection output:
[INFO] Detecting container names...
[INFO]   PostgreSQL: eg_antiq-postgres-1
[INFO]   API: eg_antiq-api-1
[INFO]   Redis: eg_antiq-redis-1
```

### 2. **Automatic Container Startup**

If containers are not running, scripts will:
- Start required containers (`postgres`, `redis`)
- Wait for them to be healthy/ready
- Re-detect container names after startup

```bash
# If PostgreSQL is not running:
[WARNING] PostgreSQL container is not running. Starting it...
[INFO] Waiting for PostgreSQL to be ready...
[SUCCESS] PostgreSQL is ready
```

### 3. **Flexible Health Checks**

Scripts now handle containers with or without health checks:
- If health check defined → Wait for "healthy" status
- If no health check → Just verify container is running
- Extended timeout (60 seconds instead of 30)

### 4. **Better Error Handling**

- More informative error messages
- Shows detected container names in logs
- Provides specific commands for troubleshooting
- Continues gracefully if optional checks fail

## Updated Scripts

### deploy-production.sh

**New Features:**
- ✅ Auto-detects container names
- ✅ Starts containers if not running
- ✅ Waits for PostgreSQL to be ready before backup
- ✅ Handles containers with/without health checks
- ✅ Shows which containers are being used

**Example Usage:**
```bash
./deploy-production.sh

# Output:
[INFO] Detecting container names...
[INFO]   PostgreSQL: eg_antiq-postgres-1
[INFO]   API: eg_antiq-api-1
[SUCCESS] Pre-flight checks passed
[INFO] Using container: eg_antiq-postgres-1
[SUCCESS] Database backup created: ./backups/backup_*.sql (2.5M)
...
```

### rollback-production.sh

**New Features:**
- ✅ Auto-detects container names
- ✅ Starts PostgreSQL if not running
- ✅ Uses detected names for all operations
- ✅ Better error messages

## Testing the Fix

### Test 1: Containers Not Running

```bash
# Stop all containers
docker compose down

# Run deployment script
./deploy-production.sh

# Should automatically:
# 1. Detect no containers running
# 2. Start postgres and redis
# 3. Wait for them to be ready
# 4. Proceed with deployment
```

### Test 2: Different Container Names

The script will work regardless of container naming convention:
- `backend-postgres`, `backend-api`
- `eg_antiq-postgres-1`, `eg_antiq-api-1`
- `project_postgres_1`, `project_api_1`
- Any other naming pattern

### Test 3: Production Environment

```bash
# SSH to production server
cd /path/to/EG_Antiq

# Run deployment
./deploy-production.sh

# Script will:
# 1. Auto-detect production container names
# 2. Start any stopped containers
# 3. Create backup
# 4. Apply migration
# 5. Rebuild and restart
```

## Migration Process

The scripts handle the complete migration process:

1. **Pre-flight Checks**
   - Verify Docker is running
   - Detect/start containers
   - Create backup directory

2. **Backup Phase**
   - Auto-detect PostgreSQL container
   - Create timestamped backup
   - Verify backup file exists and has content

3. **Migration Phase**
   - Apply Prisma migration (renames columns)
   - Regenerate Prisma Client
   - No data loss (uses SQL RENAME)

4. **Rebuild Phase**
   - Build updated application
   - Rebuild Docker containers
   - Start with new code

5. **Verification Phase**
   - Check API health
   - Verify database schema changes
   - Show sample data with new columns

## Troubleshooting

### Issue: "PostgreSQL container not detected"

**Solution:** Script will automatically start containers. If this fails:
```bash
# Manually start containers
docker compose up -d postgres redis

# Re-run deployment script
./deploy-production.sh
```

### Issue: "Failed to create database backup"

**Possible causes:**
- Database credentials incorrect
- PostgreSQL not fully started
- Disk space full

**Solution:**
```bash
# Check container logs
docker logs [postgres-container-name]

# Check disk space
df -h

# Verify PostgreSQL is responding
docker exec [postgres-container-name] pg_isready -U postgres
```

### Issue: "API container did not become healthy"

**Solution:**
```bash
# Check API logs
docker logs [api-container-name]

# Common issues:
# - Build failed (check for TypeScript errors)
# - Database connection failed
# - Port already in use
```

## Key Improvements

| Before | After |
|--------|-------|
| Hardcoded container names | Auto-detection |
| Failed if containers not running | Automatically starts containers |
| Single timeout (30s) | Extended timeout (60s) |
| No health check fallback | Handles containers with/without health checks |
| Generic error messages | Specific, actionable error messages |

## Compatibility

Works with:
- ✅ Any Docker container naming convention
- ✅ Docker Compose v1 and v2
- ✅ Containers with or without health checks
- ✅ Local development and production environments
- ✅ Different PostgreSQL versions
- ✅ Custom docker-compose file names

## What Didn't Change

- Migration SQL (still uses safe RENAME operations)
- Backup format (PostgreSQL dump)
- Database connection settings
- Application code changes

## Next Steps

1. **Test Locally** (if you haven't already):
   ```bash
   docker compose down
   ./deploy-production.sh
   ```

2. **Test in Staging** (recommended):
   ```bash
   # Copy to staging server
   scp deploy-production.sh user@staging:/path/to/project/
   # Run on staging
   ssh user@staging 'cd /path/to/project && ./deploy-production.sh'
   ```

3. **Deploy to Production**:
   ```bash
   # On production server
   cd /path/to/EG_Antiq
   ./deploy-production.sh
   ```

## Support

If you encounter issues not covered here:

1. Check script output for detected container names
2. Verify containers can start: `docker compose up -d`
3. Check Docker logs: `docker compose logs`
4. Review this file's troubleshooting section

The updated scripts are production-ready and handle edge cases gracefully! 🚀
