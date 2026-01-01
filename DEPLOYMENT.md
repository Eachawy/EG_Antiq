# Deployment Guide - Ancient Egypt Archaeological Sites Platform

This document outlines the complete process for deploying the application to **Production** using Docker Compose with automated deployment scripts.

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Automated Deployment](#automated-deployment)
- [Manual Deployment](#manual-deployment)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Maintenance Operations](#maintenance-operations)
- [Database Migrations](#database-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

For production deployment with all services (API, Frontend, Nginx, PostgreSQL, Redis):

```bash
# 1. Configure environment
cp .env.production.example .env
nano .env  # Set required variables

# 2. Run automated deployment
./scripts/deploy.sh

# 3. Setup SSL certificates (optional)
./scripts/setup-ssl.sh

# 4. View logs
./scripts/logs.sh all
```

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

## Automated Deployment

The application includes automated deployment scripts for production. This is the **recommended deployment method**.

### Architecture Overview

The production stack includes:

- **PostgreSQL** - Database server (port 5433)
- **Redis** - Cache and session store (port 6379)
- **NestJS API** - Backend application (port 3000)
- **React Frontend** - Web application served by Nginx
- **Nginx Reverse Proxy** - Main entry point (ports 80/443)
- **Certbot** - SSL certificate management (optional)

### Deployment Script

The `scripts/deploy.sh` script automates the entire deployment process:

```bash
./scripts/deploy.sh
```

**What it does:**

1. ✓ Validates environment configuration (.env file)
2. ✓ Creates required directories (backups, certs, certbot-www)
3. ✓ Builds Docker images with no cache
4. ✓ Stops existing containers gracefully
5. ✓ Starts database and Redis services
6. ✓ Waits for database to be ready
7. ✓ Runs Prisma migrations
8. ✓ Starts API, Frontend, and Nginx services
9. ✓ Performs health checks
10. ✓ Displays service status

**Output Example:**

```
========================================
  Ancient Egypt Portal - Deployment
========================================

Step 1: Creating required directories...
✓ Directories created

Step 2: Building Docker images...
✓ Build complete

Step 3: Stopping existing containers...
✓ Stopped

Step 4: Starting services...
Waiting for database to be ready...

Step 5: Running database migrations...
✓ Migrations complete

Step 6: Starting API and Frontend...
✓ All services started

Step 7: Waiting for health checks...
Checking service status...

========================================
  Deployment Complete!
========================================

Application is running at: http://localhost
API Health: http://localhost/api/v1/health
```

### Available Deployment Scripts

All scripts are located in the `scripts/` directory:

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy.sh` | Complete deployment automation | `./scripts/deploy.sh` |
| `setup-ssl.sh` | SSL certificate setup (Let's Encrypt) | `./scripts/setup-ssl.sh` |
| `backup.sh` | Database backup (keeps last 7) | `./scripts/backup.sh` |
| `restore.sh` | Database restoration | `./scripts/restore.sh` |
| `logs.sh` | View service logs | `./scripts/logs.sh [service]` |

### Viewing Logs

The `logs.sh` script provides easy access to service logs:

```bash
# View all services
./scripts/logs.sh all

# View specific service with follow (-f)
./scripts/logs.sh api -f

# View last 100 lines
./scripts/logs.sh postgres --tail=100

# Available services:
# - api       (NestJS API)
# - frontend  (React Frontend)
# - nginx     (Reverse Proxy)
# - postgres  (Database)
# - redis     (Cache)
```

### SSL Certificate Setup

The `setup-ssl.sh` script automates Let's Encrypt certificate setup:

```bash
./scripts/setup-ssl.sh
```

**Prerequisites:**
- Domain name configured and pointed to server
- `DOMAIN` and `ADMIN_EMAIL` set in .env file
- Ports 80 and 443 open in firewall

**What it does:**
1. Validates domain and email configuration
2. Obtains SSL certificate from Let's Encrypt
3. Creates auto-renewal script (`scripts/renew-ssl.sh`)
4. Provides instructions for enabling HTTPS in Nginx

**Post-setup:**
After running the script, follow the instructions to:
1. Uncomment the HTTPS server block in `docker/nginx/nginx.conf`
2. Restart Nginx: `docker compose -f docker-compose.production.yml restart nginx`
3. Setup cron job for auto-renewal

### Database Backups

The `backup.sh` script creates compressed database backups:

```bash
./scripts/backup.sh
```

**Features:**
- Creates timestamped backup files
- Compresses with gzip
- Automatically keeps last 7 backups
- Displays backup size and list

**Output:**
```
========================================
  Database Backup
========================================

Creating backup...
✓ Backup created: ./backups/antiq_backup_20260101_120000.sql.gz

Backup size: 15M

Cleaning old backups (keeping last 7)...
Backup complete!

Available backups:
-rw-r--r-- 1 root root  15M Jan  1 12:00 antiq_backup_20260101_120000.sql.gz
-rw-r--r-- 1 root root  14M Dec 31 12:00 antiq_backup_20251231_120000.sql.gz
...
```

**Automation:**
Setup daily backups with cron:
```bash
sudo crontab -e
# Add: 0 2 * * * /path/to/EG_Antiq/scripts/backup.sh >> /var/log/db-backup.log 2>&1
```

### Database Restore

The `restore.sh` script restores from backup:

```bash
./scripts/restore.sh
```

**Interactive Process:**
1. Lists available backups with sizes
2. Prompts for backup filename
3. Confirms destructive operation
4. Decompresses backup
5. Stops API service
6. Restores database
7. Restarts API service

**WARNING:** This replaces the current database. Always create a backup before restoring.

---

## Manual Deployment

If you prefer step-by-step control, follow this manual deployment process.

### Step 1: Clone Repository

```bash
# Clone repository
git clone <repository-url>
cd EG_Antiq

# Make scripts executable
chmod +x scripts/*.sh
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env

# Edit configuration
nano .env
```

**Required Environment Variables:**

```bash
# Database
DATABASE_PASSWORD=<strong-password>
DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@postgres:5433/antiq_production?schema=public

# JWT Secrets
JWT_SECRET=<generate-with: openssl rand -base64 64>
PORTAL_JWT_SECRET=<generate-with: openssl rand -base64 64>

# Domain (for SSL)
DOMAIN=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@yourdomain.com

# Redis (optional password)
REDIS_PASSWORD=<strong-password>
```

### Step 3: Create Required Directories

```bash
mkdir -p backups certs certbot-www
```

### Step 4: Build Docker Images

```bash
docker compose -f docker-compose.production.yml build --no-cache
```

**Build Process:**
- API: Multi-stage build with pnpm dependencies
- Frontend: React build served by Nginx
- All images optimized for production

### Step 5: Start Database

```bash
# Start PostgreSQL and Redis
docker compose -f docker-compose.production.yml up -d postgres redis

# Wait for database to be ready
sleep 10

# Verify database is running
docker compose -f docker-compose.production.yml ps postgres
```

### Step 6: Run Migrations

```bash
# Run Prisma migrations
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy

# Verify migration status
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate status
```

### Step 7: Start All Services

```bash
# Start API, Frontend, and Nginx
docker compose -f docker-compose.production.yml up -d api frontend nginx

# Wait for health checks
sleep 15

# Check service status
docker compose -f docker-compose.production.yml ps
```

### Step 8: Verify Deployment

```bash
# Check API health
curl http://localhost/api/v1/health
# Expected: {"status":"ok"}

# Check readiness (database connection)
curl http://localhost/api/v1/health/ready
# Expected: {"status":"ok","info":{"database":{"status":"up"}}}

# View application logs
docker compose -f docker-compose.production.yml logs -f api
```

---

## SSL/HTTPS Setup

### Automatic Setup (Recommended)

Use the automated script:

```bash
./scripts/setup-ssl.sh
```

### Manual SSL Setup

#### 1. Obtain Certificate

```bash
docker compose -f docker-compose.production.yml --profile ssl-setup run --rm certbot
```

#### 2. Enable HTTPS in Nginx

Edit `docker/nginx/nginx.conf` and uncomment the HTTPS server block (lines marked with `# SSL Configuration`).

#### 3. Restart Nginx

```bash
docker compose -f docker-compose.production.yml restart nginx
```

#### 4. Setup Auto-Renewal

Add to crontab:
```bash
sudo crontab -e
# Add:
0 0 * * * /path/to/EG_Antiq/scripts/renew-ssl.sh >> /var/log/letsencrypt-renew.log 2>&1
```

---

## Maintenance Operations

### Application Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d

# Run migrations if needed
docker compose -f docker-compose.production.yml run --rm api \
  pnpm --filter @packages/database prisma migrate deploy
```

### Service Management

```bash
# Restart specific service
docker compose -f docker-compose.production.yml restart api

# Stop all services
docker compose -f docker-compose.production.yml down

# View service status
docker compose -f docker-compose.production.yml ps

# View resource usage
docker stats
```

### Backup Management

```bash
# Create manual backup
./scripts/backup.sh

# List available backups
ls -lh backups/

# Restore from backup
./scripts/restore.sh
```

### Log Management

```bash
# View real-time logs
./scripts/logs.sh api -f

# Export logs to file
./scripts/logs.sh api --tail=1000 > api-logs.txt

# Search logs
./scripts/logs.sh api --tail=1000 | grep ERROR
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

## Docker Architecture

### Service Configuration

All services are configured in `docker-compose.production.yml`:

| Service | Image | Ports | Resources | Volume |
|---------|-------|-------|-----------|---------|
| **postgres** | postgres:15-alpine | 5433 | 2 CPU, 4GB RAM | postgres_production_data |
| **redis** | redis:7-alpine | 6379 | 1 CPU, 2GB RAM | redis_production_data |
| **api** | Custom (NestJS) | 3000 | 2 CPU, 4GB RAM | uploads_data |
| **frontend** | Custom (React+Nginx) | 80 | 1 CPU, 1GB RAM | - |
| **nginx** | nginx:1.25-alpine | 80, 443 | 1 CPU, 512MB | uploads_data (read-only) |
| **certbot** | certbot/certbot | - | - | certs, certbot-www |

### Network Architecture

```
Internet
   ↓
Nginx Reverse Proxy (Port 80/443)
   ↓
   ├─→ Frontend (React App) - Port 80
   ├─→ API (NestJS) - Port 3000
   └─→ Static Files (/uploads)
        ↓
   PostgreSQL (Port 5433) ← API
   Redis (Port 6379) ← API
```

### Volume Management

**Persistent Data:**
- `postgres_production_data` - Database files
- `redis_production_data` - Redis persistence
- `uploads_data` - User-uploaded files (gallery images)

**Shared Volumes:**
- `./backups` - Database backups (host mount)
- `./certs` - SSL certificates (host mount)
- `./certbot-www` - Let's Encrypt challenge files (host mount)

**View volumes:**
```bash
docker volume ls
docker volume inspect eg_antiq_uploads_data
```

---

## Quick Reference

### Essential Commands

```bash
# Deploy everything
./scripts/deploy.sh

# View logs
./scripts/logs.sh api -f

# Create backup
./scripts/backup.sh

# Restore backup
./scripts/restore.sh

# Setup SSL
./scripts/setup-ssl.sh

# Restart service
docker compose -f docker-compose.production.yml restart api

# Check status
docker compose -f docker-compose.production.yml ps

# View resource usage
docker stats
```

### Important File Locations

- **Environment**: `.env`
- **Docker Compose**: `docker-compose.production.yml`
- **Nginx Proxy Config**: `docker/nginx/nginx.conf`
- **Frontend Nginx**: `docker/nginx/frontend.conf`
- **API Dockerfile**: `docker/api.Dockerfile`
- **Frontend Dockerfile**: `../EG_Antiq_backend/docker/frontend.Dockerfile`
- **Deployment Scripts**: `scripts/*.sh`
- **Backups**: `./backups/`
- **SSL Certs**: `./certs/`

### Service URLs

- **Application**: `http://yourdomain.com` (or `https://` with SSL)
- **API Base**: `http://yourdomain.com/api/v1`
- **API Health**: `http://yourdomain.com/api/v1/health`
- **API Docs**: `http://yourdomain.com/api/docs` (disable in production)
- **Static Uploads**: `http://yourdomain.com/uploads/gallery/`

### Default Ports

- **Nginx**: 80 (HTTP), 443 (HTTPS)
- **API**: 3000 (internal)
- **Frontend**: 80 (internal)
- **PostgreSQL**: 5433 (non-standard to avoid conflicts)
- **Redis**: 6379

### Default Credentials

After initial deployment with seed data:
- **Admin Email**: `admin@example.com`
- **Admin Password**: `Admin123!`

**⚠️ CRITICAL**: Change default credentials immediately after first login!

### Resource Limits

Configure in `docker-compose.production.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
    reservations:
      memory: 2G
```

### Health Check Endpoints

- **Liveness**: `GET /api/v1/health` - Always returns 200 if API is running
- **Readiness**: `GET /api/v1/health/ready` - Returns 200 only if database is connected

### Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_PASSWORD` | Yes | `SecurePass123!` | PostgreSQL password |
| `JWT_SECRET` | Yes | `<64-char-secret>` | Admin JWT secret |
| `PORTAL_JWT_SECRET` | Yes | `<64-char-secret>` | Portal JWT secret |
| `DOMAIN` | SSL only | `yourdomain.com` | Domain name for SSL |
| `ADMIN_EMAIL` | SSL only | `admin@domain.com` | Email for Let's Encrypt |
| `REDIS_PASSWORD` | Optional | `RedisPass123!` | Redis password |
| `GOOGLE_CLIENT_ID` | OAuth | `xxx.apps.googleusercontent.com` | Google OAuth |
| `FACEBOOK_APP_ID` | OAuth | `123456789` | Facebook OAuth |
| `APPLE_CLIENT_ID` | OAuth | `com.yourapp.service` | Apple Sign In |
| `MAIL_HOST` | Email | `smtp.gmail.com` | SMTP server |
| `MAIL_USER` | Email | `noreply@domain.com` | SMTP username |
| `MAIL_PASSWORD` | Email | `app-password` | SMTP password |

---

## Security Best Practices

### Pre-Deployment

- [ ] Generate unique secrets for each environment (64+ characters)
- [ ] Use strong database passwords (32+ characters)
- [ ] Configure OAuth apps for production domain only
- [ ] Setup firewall rules (allow only 22, 80, 443)
- [ ] Disable root SSH login
- [ ] Enable automatic security updates

### Post-Deployment

- [ ] Change default admin credentials
- [ ] Setup SSL/HTTPS with auto-renewal
- [ ] Configure automated backups (daily recommended)
- [ ] Test backup restoration
- [ ] Setup monitoring and alerts
- [ ] Review and rotate secrets regularly
- [ ] Disable API documentation endpoint in production
- [ ] Configure rate limiting in Nginx
- [ ] Setup log rotation
- [ ] Enable database backups to external storage

### Configuration Checks

```bash
# Verify secrets are strong
echo $JWT_SECRET | wc -c  # Should be 64+

# Check PostgreSQL is not exposed
netstat -tuln | grep 5433  # Should only show 127.0.0.1

# Verify SSL is working
curl -I https://yourdomain.com

# Check rate limiting
ab -n 200 -c 10 http://yourdomain.com/api/v1/health
```

---

## Troubleshooting Guide

### Quick Diagnostics

```bash
# Check all services
docker compose -f docker-compose.production.yml ps

# Check service health
docker inspect --format='{{.State.Health.Status}}' <container-name>

# View recent logs
./scripts/logs.sh all --tail=50

# Check disk space
df -h

# Check memory usage
free -h

# Network connectivity
docker compose -f docker-compose.production.yml exec api ping postgres
```

### Common Issues

**Issue**: Database connection failed
```bash
# Solution 1: Restart database
docker compose -f docker-compose.production.yml restart postgres

# Solution 2: Check connection string
docker compose -f docker-compose.production.yml exec api env | grep DATABASE_URL
```

**Issue**: Uploaded images return 404
```bash
# Solution: Verify volume mount
docker volume inspect eg_antiq_uploads_data
docker compose -f docker-compose.production.yml restart nginx
```

**Issue**: High memory usage
```bash
# Solution: Check stats and restart
docker stats --no-stream
docker compose -f docker-compose.production.yml restart
```

**Issue**: SSL certificate expired
```bash
# Solution: Renew certificate
./scripts/renew-ssl.sh
docker compose -f docker-compose.production.yml restart nginx
```

### Emergency Procedures

**Complete system restart:**
```bash
docker compose -f docker-compose.production.yml down
docker system prune -f
docker compose -f docker-compose.production.yml up -d
```

**Database recovery:**
```bash
# Stop API
docker compose -f docker-compose.production.yml stop api

# Restore from backup
./scripts/restore.sh

# Start API
docker compose -f docker-compose.production.yml start api
```

---

## Performance Optimization

### Nginx Caching

Add to `docker/nginx/nginx.conf`:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key $scheme$request_method$host$request_uri;
    add_header X-Cache-Status $upstream_cache_status;
}
```

### Database Optimization

```bash
# Connect to database
docker compose -f docker-compose.production.yml exec postgres psql -U postgres -d antiq_production

# Run VACUUM ANALYZE
VACUUM ANALYZE;

# Check query performance
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Container Resource Tuning

Monitor and adjust in `docker-compose.production.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '4'  # Increase for better performance
      memory: 8G  # Increase if needed
```

---

**Last Updated:** 2026-01-01
**Version:** 2.0.0 - Complete Docker Stack with Automated Deployment
