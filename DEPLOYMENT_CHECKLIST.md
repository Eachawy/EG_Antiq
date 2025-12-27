# Deployment Checklist

Quick reference checklist for staging and production deployments.

## Pre-Deployment

### Staging Deployment Checklist

- [ ] Code merged to `staging` branch
- [ ] All tests passing locally
- [ ] Environment variables configured in `.env.staging`
- [ ] Database backup created (if updating existing deployment)
- [ ] Migration files reviewed
- [ ] Docker images build successfully
- [ ] SSL certificates valid (if applicable)

### Production Deployment Checklist

- [ ] All staging tests passed for 48+ hours
- [ ] Code merged to `main` branch
- [ ] Production database backup created
- [ ] Production environment variables configured in `.env.production`
- [ ] Secrets generated (unique from staging)
- [ ] OAuth apps configured for production domain
- [ ] Email service tested
- [ ] SSL certificates configured and valid
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Maintenance page ready (if needed)

---

## Deployment Steps

### Staging

```bash
# 1. SSH to staging server
ssh user@staging-server

# 2. Navigate to project
cd eg-antiq

# 3. Pull latest code
git fetch origin
git checkout staging
git pull origin staging

# 4. Backup database (if exists)
docker exec staging-postgres pg_dump -U postgres -d antiq_staging \
  --format=custom > backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump

# 5. Run migrations
docker compose -f docker-compose.staging.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy

# 6. Rebuild and restart
docker compose -f docker-compose.staging.yml build
docker compose -f docker-compose.staging.yml up -d

# 7. Verify health
curl https://api-staging.yourdomain.com/api/v1/health

# 8. Monitor logs
docker compose -f docker-compose.staging.yml logs -f api
```

### Production

```bash
# 1. SSH to production server
ssh user@production-server

# 2. Navigate to project
cd eg-antiq

# 3. Pull latest code
git fetch origin
git checkout main
git pull origin main

# 4. Create database backup
docker exec production-postgres pg_dump -U postgres -d antiq_production \
  --format=custom > backups/pre-deploy-$(date +%Y%m%d-%H%M%S).dump

# 5. Run migrations
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy

# 6. Rebuild images (no cache)
docker compose -f docker-compose.production.yml build --no-cache

# 7. Restart services with zero downtime
docker compose -f docker-compose.production.yml up -d --no-deps --build api

# 8. Verify health
curl https://api.yourdomain.com/api/v1/health

# 9. Monitor logs for 15 minutes
docker compose -f docker-compose.production.yml logs -f --tail=100 api

# 10. Test critical endpoints
curl https://api.yourdomain.com/api/v1/eras
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Post-Deployment Verification

### Automated Checks

```bash
# Health endpoint
curl https://api.yourdomain.com/api/v1/health
# Expected: {"status":"ok","info":{"database":{"status":"up"}}}

# Public endpoints
curl https://api.yourdomain.com/api/v1/eras
curl https://api.yourdomain.com/api/v1/dynasties
curl https://api.yourdomain.com/api/v1/monument-types

# API documentation
curl https://api.yourdomain.com/api/docs
```

### Manual Checks

- [ ] API health endpoint returns 200
- [ ] Public endpoints accessible
- [ ] Authentication flow works
- [ ] OAuth login works (Google, Facebook, Apple)
- [ ] Email sending works
- [ ] Database queries performing well
- [ ] No errors in logs
- [ ] SSL certificate valid
- [ ] Rate limiting working

---

## Rollback Procedure

### Quick Rollback (If deployment fails)

```bash
# 1. Stop current deployment
docker compose -f docker-compose.production.yml down

# 2. Checkout previous stable version
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 3. Restore database backup (if needed)
docker compose -f docker-compose.production.yml up -d postgres
docker exec -i production-postgres pg_restore \
  -U postgres -d antiq_production --clean \
  < backups/pre-deploy-YYYYMMDD-HHMMSS.dump

# 4. Restart services
docker compose -f docker-compose.production.yml up -d

# 5. Verify
curl https://api.yourdomain.com/api/v1/health
```

---

## Emergency Contacts

| Role | Contact | Phone |
|------|---------|-------|
| DevOps Lead | - | - |
| Backend Lead | - | - |
| Database Admin | - | - |
| On-Call Engineer | - | - |

---

## Common Issues & Quick Fixes

### Container Won't Start

```bash
# Check logs
docker compose logs api

# Check resource usage
docker stats

# Restart container
docker compose restart api
```

### Database Connection Failed

```bash
# Test database
docker exec production-postgres psql -U postgres -d antiq_production -c "SELECT 1"

# Check database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart all containers
docker compose restart

# Clear unused Docker resources
docker system prune -a
```

### SSL Certificate Expired

```bash
# Renew certificate
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

---

## Monitoring Commands

```bash
# Check container status
docker compose ps

# View logs (last 100 lines)
docker compose logs --tail=100 api

# Follow logs live
docker compose logs -f api

# Check resource usage
docker stats

# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/production-api-error.log

# Check application logs
docker compose exec api cat logs/app.log | tail -100
```

---

## Database Management

### Create Backup

```bash
# Manual backup
docker exec production-postgres pg_dump -U postgres -d antiq_production \
  --format=custom > backups/manual-$(date +%Y%m%d-%H%M%S).dump
```

### Restore Backup

```bash
# List backups
ls -lh backups/

# Restore specific backup
docker exec -i production-postgres pg_restore \
  -U postgres -d antiq_production --clean \
  < backups/manual-YYYYMMDD-HHMMSS.dump
```

### Run Migration

```bash
# Check migration status
docker compose run --rm api pnpm --filter @packages/database prisma migrate status

# Apply migrations
docker compose run --rm api pnpm --filter @packages/database prisma migrate deploy
```

---

## Performance Checks

```bash
# Response time test
time curl https://api.yourdomain.com/api/v1/health

# Load test (requires apache2-utils)
ab -n 1000 -c 10 https://api.yourdomain.com/api/v1/health

# Database connection count
docker exec production-postgres psql -U postgres -d antiq_production \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
docker exec production-postgres psql -U postgres -d antiq_production \
  -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## Useful Docker Commands

```bash
# View all containers
docker ps -a

# View images
docker images

# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# View container resource usage
docker stats --no-stream

# Execute command in container
docker compose exec api sh

# View container environment variables
docker compose exec api env

# Restart single service
docker compose restart api

# View service configuration
docker compose config
```

---

**Last Updated:** 2025-12-27
