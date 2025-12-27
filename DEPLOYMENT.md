# Deployment Guide - Ancient Egypt Archaeological Sites Platform

This document outlines the complete process for deploying the application to **Staging** and **Production** environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Database Migrations](#database-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Node.js** (v20.0+)
- **pnpm** (v10.26.0+)
- **PostgreSQL Client** (for database operations)
- **Git** (for version control)

### Access Requirements

- SSH access to staging/production servers
- Database credentials for each environment
- SSL certificates for HTTPS (production)
- OAuth credentials (Google, Facebook, Apple)
- SMTP credentials for email service
- Container registry access (if using private registry)

---

## Environment Setup

### 1. Server Requirements

#### Minimum Specifications

**Staging:**
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS or similar

**Production:**
- **CPU**: 4 vCPUs (recommended: 8)
- **RAM**: 8GB (recommended: 16GB)
- **Storage**: 100GB SSD (recommended: 200GB)
- **OS**: Ubuntu 22.04 LTS or similar

### 2. Install Docker & Docker Compose

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify Docker installation
docker --version
docker compose version
```

### 3. Install PostgreSQL Client (for migrations)

```bash
sudo apt install -y postgresql-client
```

### 4. Setup SSL Certificates (Production Only)

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
```

---

## Staging Deployment

### Step 1: Clone Repository

```bash
# SSH into staging server
ssh user@staging-server

# Clone repository
git clone https://github.com/your-org/eg-antiq.git
cd eg-antiq

# Checkout staging branch
git checkout staging
```

### Step 2: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env.staging

# Edit environment file
nano .env.staging
```

**Required Environment Variables for Staging:**

```bash
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api-staging.yourdomain.com

# Database
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@postgres:5433/antiq_staging?schema=public

# Admin JWT (for organization users)
JWT_SECRET=GENERATE_STRONG_32_CHAR_SECRET_FOR_STAGING
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d

# Portal JWT (for portal users)
PORTAL_JWT_SECRET=GENERATE_STRONG_32_CHAR_SECRET_FOR_STAGING
PORTAL_JWT_ACCESS_TOKEN_TTL=15m
PORTAL_JWT_REFRESH_TOKEN_TTL=7d

# OAuth - Google (staging credentials)
GOOGLE_CLIENT_ID=your-staging-google-client-id
GOOGLE_CLIENT_SECRET=your-staging-google-client-secret

# OAuth - Facebook (staging credentials)
FACEBOOK_APP_ID=your-staging-facebook-app-id
FACEBOOK_APP_SECRET=your-staging-facebook-app-secret

# OAuth - Apple Sign In (staging credentials)
APPLE_CLIENT_ID=your-staging-apple-service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/app/certs/AuthKey_STAGING.p8

# Security
CORS_ORIGINS=https://staging.yourdomain.com,https://api-staging.yourdomain.com

# Observability
LOG_LEVEL=debug

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@staging.yourdomain.com
EMAIL_PASSWORD=YOUR_EMAIL_APP_PASSWORD
EMAIL_FROM=noreply@staging.yourdomain.com
EMAIL_FROM_NAME=EG Antiq Staging
FRONTEND_URL=https://staging.yourdomain.com
```

### Step 3: Generate Strong Secrets

```bash
# Generate JWT secrets (32+ characters)
openssl rand -base64 32
openssl rand -base64 32

# Update .env.staging with generated secrets
```

### Step 4: Setup Docker Compose for Staging

Create `docker-compose.staging.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: staging-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: antiq_staging
      PGPORT: 5433
    ports:
      - '5433:5433'
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -p 5433']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - staging-network
    restart: always

  redis:
    image: redis:7-alpine
    container_name: staging-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_staging_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - staging-network
    restart: always

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
      target: production
    container_name: staging-api
    env_file:
      - .env.staging
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DATABASE_PASSWORD}@postgres:5433/antiq_staging?schema=public
      LOG_LEVEL: debug
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - staging-network
    restart: always
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/api/v1/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  staging-network:
    driver: bridge

volumes:
  postgres_staging_data:
  redis_staging_data:
```

### Step 5: Run Database Migrations

```bash
# Start only the database
docker compose -f docker-compose.staging.yml up -d postgres

# Wait for database to be ready
sleep 10

# Run migrations
docker compose -f docker-compose.staging.yml run --rm api pnpm --filter @packages/database prisma migrate deploy

# Seed initial data (optional)
docker compose -f docker-compose.staging.yml run --rm api pnpm --filter @packages/database prisma db seed
```

### Step 6: Build and Start Services

```bash
# Build Docker images
docker compose -f docker-compose.staging.yml build

# Start all services
docker compose -f docker-compose.staging.yml up -d

# Check logs
docker compose -f docker-compose.staging.yml logs -f api
```

### Step 7: Verify Deployment

```bash
# Check health endpoint
curl https://api-staging.yourdomain.com/api/v1/health

# Expected response:
# {"status":"ok","info":{"database":{"status":"up"}},"error":{},"details":{"database":{"status":"up"}}}

# Check API documentation
curl https://api-staging.yourdomain.com/api/docs

# Test public endpoints
curl https://api-staging.yourdomain.com/api/v1/eras
```

### Step 8: Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/staging-api
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name api-staging.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-staging.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/api-staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-staging.yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    # Logging
    access_log /var/log/nginx/staging-api-access.log;
    error_log /var/log/nginx/staging-api-error.log;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/staging-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Production Deployment

### Step 1: Pre-Deployment Checklist

- [ ] All staging tests passed
- [ ] Database backup created
- [ ] SSL certificates configured
- [ ] Production secrets generated
- [ ] OAuth apps configured for production domain
- [ ] Email service configured
- [ ] Monitoring tools ready
- [ ] Rollback plan documented

### Step 2: Clone Repository on Production Server

```bash
# SSH into production server
ssh user@production-server

# Clone repository
git clone https://github.com/your-org/eg-antiq.git
cd eg-antiq

# Checkout production branch
git checkout main  # or production branch
```

### Step 3: Configure Production Environment

```bash
# Copy example environment file
cp .env.example .env.production

# Edit environment file with production values
nano .env.production
```

**Production Environment Variables:**

```bash
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com

# Database (use managed PostgreSQL service recommended)
DATABASE_URL=postgresql://postgres:STRONG_PRODUCTION_PASSWORD@postgres:5433/antiq_production?schema=public

# Admin JWT (MUST be different from staging)
JWT_SECRET=GENERATE_UNIQUE_STRONG_64_CHAR_SECRET_FOR_PRODUCTION
JWT_ACCESS_TOKEN_TTL=15m
JWT_REFRESH_TOKEN_TTL=7d

# Portal JWT (MUST be different from staging)
PORTAL_JWT_SECRET=GENERATE_UNIQUE_STRONG_64_CHAR_SECRET_FOR_PRODUCTION
PORTAL_JWT_ACCESS_TOKEN_TTL=15m
PORTAL_JWT_REFRESH_TOKEN_TTL=7d

# OAuth - Google (production credentials)
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# OAuth - Facebook (production credentials)
FACEBOOK_APP_ID=your-production-facebook-app-id
FACEBOOK_APP_SECRET=your-production-facebook-app-secret

# OAuth - Apple Sign In (production credentials)
APPLE_CLIENT_ID=your-production-apple-service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/app/certs/AuthKey_PRODUCTION.p8

# Security
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Observability
LOG_LEVEL=info

# Email (production SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=YOUR_SENDGRID_API_KEY
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Ancient Egypt Sites
FRONTEND_URL=https://yourdomain.com
```

### Step 4: Generate Production Secrets

```bash
# Generate strong secrets (64 characters for production)
openssl rand -base64 64
openssl rand -base64 64

# Store secrets securely (use a password manager or secrets management service)
```

### Step 5: Setup Production Docker Compose

Create `docker-compose.production.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: production-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: antiq_production
      PGPORT: 5433
    ports:
      - '127.0.0.1:5433:5433'  # Only localhost access
    volumes:
      - postgres_production_data:/var/lib/postgresql/data
      - ./backups:/backups  # Backup directory
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres -p 5433']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - production-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: production-redis
    ports:
      - '127.0.0.1:6379:6379'  # Only localhost access
    volumes:
      - redis_production_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ['CMD', 'redis-cli', '--raw', 'incr', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - production-network
    restart: always

  api:
    build:
      context: .
      dockerfile: docker/api.Dockerfile
      target: production
    container_name: production-api
    env_file:
      - .env.production
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DATABASE_PASSWORD}@postgres:5433/antiq_production?schema=public
      LOG_LEVEL: info
    ports:
      - '127.0.0.1:3000:3000'  # Only localhost access (behind Nginx)
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - production-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          memory: 2G
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:3000/api/v1/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

networks:
  production-network:
    driver: bridge

volumes:
  postgres_production_data:
    driver: local
  redis_production_data:
    driver: local
```

### Step 6: Database Backup Before Deployment

```bash
# Create backup directory
mkdir -p backups

# If migrating from existing database, create backup
PGPASSWORD=old_password pg_dump -h old_host -p 5432 -U postgres -d old_database \
  --format=custom --file=backups/pre-deployment-$(date +%Y%m%d-%H%M%S).dump
```

### Step 7: Run Production Migrations

```bash
# Start database only
docker compose -f docker-compose.production.yml up -d postgres

# Wait for database to be ready
sleep 15

# Run migrations
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy

# Verify migrations
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate status
```

### Step 8: Deploy Production Services

```bash
# Build production images
docker compose -f docker-compose.production.yml build --no-cache

# Start all services
docker compose -f docker-compose.production.yml up -d

# Monitor logs
docker compose -f docker-compose.production.yml logs -f api
```

### Step 9: Setup Production Nginx with SSL

```bash
# Install Nginx
sudo apt install -y nginx

# Create production configuration
sudo nano /etc/nginx/sites-available/production-api
```

**Production Nginx Configuration:**

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_auth_limit:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=api_general_limit:10m rate=60r/m;

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/api.yourdomain.com/chain.pem;

    # SSL Configuration (Mozilla Modern)
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Logging
    access_log /var/log/nginx/production-api-access.log combined;
    error_log /var/log/nginx/production-api-error.log warn;

    # Rate limiting for authentication endpoints
    location ~ ^/api/v1/(auth|portal/auth) {
        limit_req zone=api_auth_limit burst=5 nodelay;
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }

    # General API endpoints
    location /api/ {
        limit_req zone=api_general_limit burst=20 nodelay;
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }

    # Health check endpoint (no rate limit)
    location /api/v1/health {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }

    # API Documentation
    location /api/docs {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }

    # Default location
    location / {
        proxy_pass http://localhost:3000;
        include /etc/nginx/proxy_params;
    }
}
```

Create `/etc/nginx/proxy_params`:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Buffer settings
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/production-api /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### Step 10: Setup Automatic SSL Renewal

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron job
sudo crontab -e

# Add this line:
0 3 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### Step 11: Production Verification

```bash
# Check health endpoint
curl https://api.yourdomain.com/api/v1/health

# Check SSL rating
curl https://api.yourdomain.com/api/v1/health -I

# Test authentication flow
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'

# Monitor logs
docker compose -f docker-compose.production.yml logs -f --tail=100 api
```

---

## Database Migrations

### Running Migrations in Production

```bash
# 1. Create a backup BEFORE migration
docker exec production-postgres pg_dump -U postgres -d antiq_production \
  --format=custom > backups/pre-migration-$(date +%Y%m%d-%H%M%S).dump

# 2. Check migration status
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate status

# 3. Run migration
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy

# 4. Verify migration
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate status
```

### Creating New Migrations

```bash
# On development machine
pnpm --filter @packages/database prisma migrate dev --name add_new_feature

# Commit migration files
git add packages/database/prisma/migrations
git commit -m "feat: add database migration for new feature"
git push

# Deploy to staging first
ssh staging-server
cd eg-antiq
git pull
docker compose -f docker-compose.staging.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy

# After staging verification, deploy to production
```

---

## Rollback Procedures

### Application Rollback

```bash
# 1. Stop current containers
docker compose -f docker-compose.production.yml down

# 2. Checkout previous version
git log --oneline  # Find previous stable commit
git checkout <previous-commit-hash>

# 3. Rebuild and restart
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d

# 4. Monitor logs
docker compose -f docker-compose.production.yml logs -f api
```

### Database Rollback

```bash
# 1. Stop API to prevent new writes
docker compose -f docker-compose.production.yml stop api

# 2. Restore from backup
docker exec -i production-postgres pg_restore \
  -U postgres -d antiq_production --clean \
  < backups/pre-migration-YYYYMMDD-HHMMSS.dump

# 3. Restart API with previous version
docker compose -f docker-compose.production.yml up -d api
```

---

## Monitoring & Health Checks

### Setup Health Check Monitoring

Create `/usr/local/bin/health-check.sh`:

```bash
#!/bin/bash

HEALTH_URL="https://api.yourdomain.com/api/v1/health"
SLACK_WEBHOOK="your-slack-webhook-url"  # Optional

# Check health endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $HTTP_CODE -ne 200 ]; then
    echo "[ERROR] Health check failed with HTTP $HTTP_CODE"

    # Send alert to Slack (optional)
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"Production API health check failed: HTTP $HTTP_CODE\"}" \
      $SLACK_WEBHOOK

    # Restart containers
    cd /path/to/eg-antiq
    docker compose -f docker-compose.production.yml restart api
else
    echo "[OK] Health check passed"
fi
```

```bash
# Make executable
chmod +x /usr/local/bin/health-check.sh

# Add to crontab (check every 5 minutes)
crontab -e
# Add:
*/5 * * * * /usr/local/bin/health-check.sh >> /var/log/health-check.log 2>&1
```

### Log Monitoring

```bash
# Install log rotation
sudo nano /etc/logrotate.d/nginx

# Add:
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### Database Backup Automation

Create `/usr/local/bin/backup-database.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/path/to/eg-antiq/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/antiq-production-$TIMESTAMP.dump"

# Create backup
docker exec production-postgres pg_dump -U postgres -d antiq_production \
  --format=custom > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make executable
chmod +x /usr/local/bin/backup-database.sh

# Add daily backup to crontab
crontab -e
# Add:
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/database-backup.log 2>&1
```

---

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.production.yml logs api

# Check container status
docker compose -f docker-compose.production.yml ps

# Restart specific service
docker compose -f docker-compose.production.yml restart api
```

#### 2. Database Connection Errors

```bash
# Test database connection
docker exec production-postgres psql -U postgres -d antiq_production -c "SELECT 1"

# Check database logs
docker compose -f docker-compose.production.yml logs postgres
```

#### 3. High Memory Usage

```bash
# Check container resource usage
docker stats

# Restart containers
docker compose -f docker-compose.production.yml restart

# If persistent, increase server resources
```

#### 4. SSL Certificate Issues

```bash
# Test SSL certificate
openssl s_client -connect api.yourdomain.com:443

# Renew certificate manually
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Performance Optimization

```bash
# Enable Nginx caching
# Add to nginx config:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
proxy_cache api_cache;
proxy_cache_valid 200 1m;
```

---

## Security Checklist

- [ ] All secrets are generated uniquely for each environment
- [ ] Database passwords are strong (32+ characters)
- [ ] JWT secrets are 64+ characters
- [ ] PostgreSQL is not exposed to the internet
- [ ] Redis requires authentication
- [ ] SSL certificates are valid and auto-renewing
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] CORS is properly configured
- [ ] Log files don't contain sensitive data
- [ ] Regular backups are automated
- [ ] OAuth credentials are for production domains only
- [ ] Firewall is configured (UFW/iptables)

---

## Post-Deployment

### 1. Monitor for 24 Hours

```bash
# Watch logs continuously
docker compose -f docker-compose.production.yml logs -f api

# Check error rates
grep -c "ERROR" /var/log/nginx/production-api-error.log
```

### 2. Performance Testing

```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.yourdomain.com/api/v1/health
```

### 3. Update Documentation

- Document deployment date and version
- Record any issues encountered
- Update runbook with lessons learned

---

## Quick Reference Commands

### Staging

```bash
# Deploy staging
cd eg-antiq && git pull origin staging
docker compose -f docker-compose.staging.yml build
docker compose -f docker-compose.staging.yml up -d

# View logs
docker compose -f docker-compose.staging.yml logs -f api

# Restart
docker compose -f docker-compose.staging.yml restart api
```

### Production

```bash
# Deploy production
cd eg-antiq && git pull origin main
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# View logs
docker compose -f docker-compose.production.yml logs -f api

# Restart
docker compose -f docker-compose.production.yml restart api

# Health check
curl https://api.yourdomain.com/api/v1/health
```

---

## Support

For deployment issues, contact:
- DevOps Team: devops@yourdomain.com
- Emergency Hotline: +XX-XXX-XXX-XXXX

---

**Last Updated:** 2025-12-27
**Version:** 1.0.0
