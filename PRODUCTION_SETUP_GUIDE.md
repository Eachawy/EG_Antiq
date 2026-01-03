# Production Setup Guide

## Quick Start

```bash
cd /root/EG_Antiq

# 1. Generate environment file with secure secrets
./scripts/setup-env.sh

# 2. Deploy application
./scripts/deploy.sh

# 3. Check status
docker compose -f docker-compose.production.yml ps
```

## Common Issues & Solutions

### Issue 1: "invalid port number in database URL"

**Symptom:**
```
Error: P1013: The provided database string is invalid. invalid port number in database URL
```

**Cause:** The `DATABASE_PASSWORD` contains special characters (`+`, `/`, `=`) that break URL parsing.

**Solution:**

```bash
# Option 1: Regenerate .env with URL-safe passwords (RECOMMENDED)
rm .env
./scripts/setup-env.sh

# Option 2: Manually fix DATABASE_PASSWORD to be alphanumeric only
nano .env

# Change from:
# DATABASE_PASSWORD=abc+def/123=

# To (alphanumeric only):
# DATABASE_PASSWORD=3a5f7b9c2e4d6f8a1b3c5e7f9a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b
```

**Generate URL-safe passwords:**
```bash
# CORRECT - Generates hexadecimal (0-9, a-f only)
openssl rand -hex 32

# WRONG - Generates base64 with special chars
openssl rand -base64 32
```

### Issue 2: API Container Keeps Restarting

**Symptom:**
```bash
docker compose -f docker-compose.production.yml ps
# Shows: Restarting (X) Y seconds ago
```

**Debug Steps:**

```bash
# 1. Check API logs for errors
docker compose -f docker-compose.production.yml logs api --tail=100

# 2. Check if database is ready
docker compose -f docker-compose.production.yml exec postgres pg_isready -U postgres -p 5433

# 3. Verify environment variables
grep -E "^(DATABASE_PASSWORD|JWT_SECRET|PORTAL_JWT_SECRET)=" .env

# 4. Run diagnostics
./scripts/diagnose.sh
```

**Common Causes:**

1. **Missing environment variables** → Run `./scripts/setup-env.sh`
2. **Special chars in password** → Use `openssl rand -hex 32`
3. **Database not ready** → Wait longer or check postgres logs
4. **Wrong DATABASE_URL format** → Check .env.production.example

### Issue 3: Database Connection Failed

**Symptom:**
```
Error: connect ECONNREFUSED postgres:5433
```

**Solution:**

```bash
# Stop everything
docker compose -f docker-compose.production.yml down

# Start database first and wait
docker compose -f docker-compose.production.yml up -d postgres redis
sleep 20

# Verify database is ready
docker compose -f docker-compose.production.yml logs postgres --tail=20

# Push schema to database
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma db push

# Start API
docker compose -f docker-compose.production.yml up -d api nginx
```

### Issue 4: Missing .env File

**Symptom:**
```
env file /root/EG_Antiq/.env not found
```

**Solution:**

```bash
# Automated setup (generates secure secrets)
./scripts/setup-env.sh

# Or manual setup
cp .env.production.example .env
nano .env  # Edit and replace ALL CHANGE_THIS placeholders
```

## Required Environment Variables

### Minimum Required

```bash
NODE_ENV=production
DATABASE_PASSWORD=<64-char-hex>      # openssl rand -hex 32
DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@postgres:5433/antiq_production?schema=public
JWT_SECRET=<64-char-base64>          # openssl rand -base64 64
PORTAL_JWT_SECRET=<64-char-base64>   # openssl rand -base64 64 (different!)
```

### Important Rules

1. **DATABASE_PASSWORD** → Use `openssl rand -hex 32` (URL-safe)
2. **JWT_SECRET** → Use `openssl rand -base64 64` (can have special chars)
3. **PORTAL_JWT_SECRET** → Use `openssl rand -base64 64` (MUST be different from JWT_SECRET)

### Why Different Commands?

| Variable | Command | Reason |
|----------|---------|--------|
| DATABASE_PASSWORD | `openssl rand -hex 32` | Used in URLs → needs alphanumeric only |
| REDIS_PASSWORD | `openssl rand -hex 32` | Used in URLs → needs alphanumeric only |
| JWT_SECRET | `openssl rand -base64 64` | Not in URLs → can have any chars |
| PORTAL_JWT_SECRET | `openssl rand -base64 64` | Not in URLs → can have any chars |

## Step-by-Step Manual Setup

### 1. Generate Secrets

```bash
# Database password (URL-safe)
echo "DATABASE_PASSWORD=$(openssl rand -hex 32)"

# Redis password (URL-safe)
echo "REDIS_PASSWORD=$(openssl rand -hex 32)"

# JWT secrets (can have special chars)
echo "JWT_SECRET=$(openssl rand -base64 64)"
echo "PORTAL_JWT_SECRET=$(openssl rand -base64 64)"
```

### 2. Create .env File

```bash
cp .env.production.example .env
nano .env
```

Replace all `CHANGE_THIS_*` placeholders with your generated secrets.

### 3. Deploy

```bash
# Build images
docker compose -f docker-compose.production.yml build --no-cache

# Start database
docker compose -f docker-compose.production.yml up -d postgres redis
sleep 20

# Initialize database
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma db push

# Start all services
docker compose -f docker-compose.production.yml up -d

# Check status
docker compose -f docker-compose.production.yml ps
```

### 4. Verify

```bash
# Check all containers are healthy
docker compose -f docker-compose.production.yml ps

# Check API logs
docker compose -f docker-compose.production.yml logs api --tail=50

# Test health endpoint (from inside API container)
docker compose -f docker-compose.production.yml exec api node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {r.on('data', d => console.log(d.toString())); console.log('Status:', r.statusCode)})"
```

## Useful Commands

```bash
# View all logs
docker compose -f docker-compose.production.yml logs -f

# View API logs only
docker compose -f docker-compose.production.yml logs -f api

# Restart a service
docker compose -f docker-compose.production.yml restart api

# Stop everything
docker compose -f docker-compose.production.yml down

# Stop and remove volumes (CAREFUL - deletes data!)
docker compose -f docker-compose.production.yml down -v

# Check resource usage
docker stats --no-stream

# Run migrations
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma migrate deploy

# Push schema changes
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma db push

# Access database CLI
docker compose -f docker-compose.production.yml exec postgres psql -U postgres -d antiq_production -p 5433
```

## Security Checklist

- [ ] All secrets generated uniquely (not copied from example)
- [ ] DATABASE_PASSWORD is URL-safe (no `+`, `/`, `=` characters)
- [ ] JWT_SECRET and PORTAL_JWT_SECRET are different from each other
- [ ] .env file has 600 permissions: `chmod 600 .env`
- [ ] .env is in .gitignore (never commit secrets!)
- [ ] Production database password is different from development
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] SSL certificates configured
- [ ] Database backups automated

## Need Help?

1. **Check logs:** `./scripts/diagnose.sh`
2. **View errors:** `docker compose -f docker-compose.production.yml logs api --tail=100`
3. **Restart fresh:** `docker compose -f docker-compose.production.yml down && docker compose -f docker-compose.production.yml up -d`

## Quick Reference

| Issue | Command |
|-------|---------|
| Check status | `docker compose -f docker-compose.production.yml ps` |
| View logs | `docker compose -f docker-compose.production.yml logs -f api` |
| Restart API | `docker compose -f docker-compose.production.yml restart api` |
| Run diagnostics | `./scripts/diagnose.sh` |
| Access database | `docker compose -f docker-compose.production.yml exec postgres psql -U postgres -d antiq_production -p 5433` |
| Rebuild | `docker compose -f docker-compose.production.yml build --no-cache api` |
