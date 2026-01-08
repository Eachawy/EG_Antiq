# Production Deployment Guide - Monument Date Fields Migration

This guide explains how to safely deploy the monument date field refactoring to production.

## 📋 What This Deployment Does

This deployment renames and expands monument date fields:

- **Renames:**
  - `mDate` → `startDate`
  - `mDateHijri` → `startDateHijri`

- **Adds:**
  - `endDate` (optional)
  - `endDateHijri` (optional)

**Changes apply to:**
- ✅ Database schema (column renames + new columns)
- ✅ API DTOs and services
- ✅ Frontend forms and tables
- ✅ CSV import/export format

## ⚠️ Breaking Changes

**CSV Format:** Existing CSV files with old column names (`mDate`, `mDateHijri`) will **NOT** work after this deployment. Users must update CSV files to use new column names.

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

```bash
# Run the deployment script
./deploy-production.sh
```

The script will:
1. ✅ Create automatic database backup
2. ✅ Apply migration safely
3. ✅ Rebuild and restart containers
4. ✅ Verify deployment success
5. ✅ Show rollback instructions

### Option 2: Manual Deployment

See [Manual Deployment Steps](#manual-deployment-steps) below.

## 📁 Files Created

- `deploy-production.sh` - Automated deployment script
- `rollback-production.sh` - Rollback script if issues occur
- `DEPLOYMENT_GUIDE.md` - This file

## 🔄 Before Deployment

### Prerequisites

- [ ] Docker and Docker Compose installed
- [ ] Database is accessible
- [ ] Sufficient disk space for backup (check current DB size)
- [ ] API is running and healthy

### Recommended Steps

1. **Test in Staging First** (if available)
   ```bash
   # Copy production data to staging
   # Run deployment script on staging
   # Verify everything works
   ```

2. **Notify Users** (if applicable)
   - Inform users about brief downtime (2-5 minutes)
   - Warn about CSV format change

3. **Review Changes**
   ```bash
   git log --oneline -5
   git diff HEAD~1
   ```

## 📝 Deployment Steps

### Automated Deployment

```bash
# Navigate to project directory
cd /path/to/EG_Antiq

# Run deployment script
./deploy-production.sh
```

**Script will prompt you:**
1. Confirm deployment start
2. Confirm migration after backup
3. Display success message and rollback instructions

**Expected Output:**
```
[INFO] ======================================================================
[INFO]      Production Deployment - Monument Date Fields Migration
[INFO] ======================================================================

[SUCCESS] Pre-flight checks passed
[SUCCESS] Database backup created: ./backups/backup_before_date_migration_20260109_123456.sql (2.5M)
[SUCCESS] Database migration applied successfully
[SUCCESS] Prisma Client regenerated successfully
[SUCCESS] Application built successfully
[SUCCESS] Containers restarted successfully
[SUCCESS] API container is healthy
[SUCCESS] API health check passed (HTTP 200)
[SUCCESS] Database schema verified

[SUCCESS] ======================================================================
[SUCCESS]               DEPLOYMENT COMPLETED SUCCESSFULLY!
[SUCCESS] ======================================================================
```

### Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Create backup
mkdir -p backups
docker exec backend-postgres pg_dump -U postgres -d Antiq_db --clean --if-exists > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
export DATABASE_URL="postgresql://postgres:Antiq_dev@localhost:5433/Antiq_db?schema=public"
pnpm --filter @packages/database prisma migrate deploy
pnpm prisma:generate

# 3. Build application
pnpm build

# 4. Restart containers
docker compose down api
docker compose -f docker-compose.yml up -d --build api

# 5. Verify
docker logs backend-api --tail 50
curl http://localhost:3000/api/v1/health
```

## 🔙 Rollback

If something goes wrong, use the rollback script:

```bash
./rollback-production.sh
```

**The script will:**
1. List available backups
2. Ask you to select a backup (or use 'latest')
3. Restore the database
4. Optionally revert code changes
5. Rebuild and restart containers
6. Verify rollback success

### Manual Rollback

```bash
# 1. Stop API
docker compose down api

# 2. Restore database
docker exec -i backend-postgres psql -U postgres -d Antiq_db < backups/backup_[timestamp].sql

# 3. Revert code (optional)
git revert HEAD

# 4. Rebuild and restart
pnpm build
docker compose up -d --build api
```

## ✅ Post-Deployment Verification

### 1. Check API Health

```bash
# Test health endpoint
curl http://localhost:3000/api/v1/health

# Expected: {"status":"ok"}
```

### 2. Verify Database Schema

```bash
# Check columns exist
docker exec backend-postgres psql -U postgres -d Antiq_db -c "\d monuments"

# Should show:
#   start_date       | character varying
#   end_date         | character varying
#   start_date_Hijri | character varying
#   end_date_Hijri   | character varying
```

### 3. Test API Endpoints

```bash
# Get monuments
curl http://localhost:3000/api/v1/monuments | jq '.[0]'

# Should include: startDate, endDate, startDateHijri, endDateHijri
```

### 4. Check Data Integrity

```bash
# Verify data was preserved
docker exec backend-postgres psql -U postgres -d Antiq_db -c "
  SELECT
    COUNT(*) as total_monuments,
    COUNT(start_date) as with_start_date,
    COUNT(end_date) as with_end_date
  FROM monuments;
"
```

### 5. Test Frontend

- ✅ Login to admin panel
- ✅ Navigate to Monuments page
- ✅ Verify table shows 4 date columns
- ✅ Edit an existing monument (dates should load correctly)
- ✅ Create a new monument with all 4 date fields
- ✅ Try CSV import with new format

### 6. Test CSV Import

Create a test CSV file:

```csv
monumentNameAr,monumentNameEn,monumentBiographyAr,monumentBiographyEn,lat,lng,image,startDate,endDate,startDateHijri,endDateHijri,monumentsTypeId,eraId,dynastyId,zoom,center,descriptionEn,descriptionAr
معبد تجريبي,Test Temple,سيرة تجريبية,Test biography,25.5,32.5,uploads/test.jpg,2500 BC,2480 BC,15/03/1446,20/05/1446,1,1,1,10,25.5;32.5,Test description,وصف تجريبي
```

Upload via admin panel and verify it imports successfully.

## 📊 Monitoring After Deployment

### First 30 Minutes

```bash
# Monitor API logs
docker logs -f backend-api

# Check for errors
docker logs backend-api | grep -i error

# Monitor container health
watch -n 5 'docker ps --format "table {{.Names}}\t{{.Status}}"'
```

### First 24 Hours

- Monitor error logs for unexpected issues
- Check user feedback about CSV format change
- Verify all monument operations work correctly
- Check database performance

## 🐛 Troubleshooting

### API Won't Start

```bash
# Check logs
docker logs backend-api --tail 100

# Common issues:
# - Prisma client not regenerated: pnpm prisma:generate
# - Build failed: pnpm build
# - Database connection: check docker-compose.yml
```

### Migration Failed

```bash
# Check migration status
pnpm --filter @packages/database prisma migrate status

# If migration is partially applied, restore from backup:
./rollback-production.sh
```

### Old Column Names Still Referenced

```bash
# Search for old field names in code
grep -r "mDate" apps/api/src/
grep -r "mDateHijri" apps/api/src/

# If found, update and redeploy
```

### CSV Import Fails

Error: "Column mDate not found"
- **Cause:** User uploaded old CSV format
- **Solution:** Update CSV file with new column names (startDate, endDate, etc.)

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review deployment logs in `./backups/` directory
3. Check API logs: `docker logs backend-api`
4. Use rollback script if needed: `./rollback-production.sh`

## 📚 Additional Resources

- **Migration File:** `packages/database/prisma/migrations/20260109010317_rename_and_expand_monument_dates/migration.sql`
- **API Changes:** See git diff for `apps/api/src/modules/monuments/`
- **Frontend Changes:** See git diff for `EG_Antiq_backend/src/main/webapp/app/modules/pages/monuments/`

## 🎯 Success Criteria

Deployment is successful when:

- ✅ API starts and is healthy
- ✅ Database schema has new column names
- ✅ All existing monument data is preserved
- ✅ Frontend displays 4 date columns
- ✅ Create/Edit operations work with new fields
- ✅ CSV import works with new format
- ✅ No errors in API logs

## 📝 Change Log

**Version:** 1.0.0
**Date:** 2026-01-09
**Changes:**
- Renamed `mDate` to `startDate`
- Renamed `mDateHijri` to `startDateHijri`
- Added `endDate` field
- Added `endDateHijri` field
- Updated API, frontend, and CSV format

**Breaking Changes:**
- CSV format changed (old CSV files won't work)

**Data Migration:**
- All existing data preserved via column rename
- No data loss expected
