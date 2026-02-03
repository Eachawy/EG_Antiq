# Production Deployment Guide - Kemetra Stack

This guide covers deploying the complete Kemetra stack (API, Admin Frontend, Portal Frontend) with Docker, Nginx, SSL, and monitoring.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Initial Setup](#initial-setup)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────┐
│         Nginx Reverse Proxy (Port 80/443)       │
│  - SSL/TLS Termination (Let's Encrypt)          │
│  - Domain-based routing                         │
│  - Static file serving (admin)                  │
│  - Rate limiting & security headers             │
└─────────────────────────────────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Service │  │Admin Frontend│  │Portal Frontend│
│  (NestJS)    │  │ (React SPA)  │  │  (Next.js)    │
│  Port: 3000  │  │Static Files  │  │  Port: 3000   │
└──────────────┘  └──────────────┘  └──────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────┐     ┌────────────┐  ┌─────────┐
│Postgres│ │Redis │     │ Prometheus │  │ Grafana │
│ 5432   │ │ 6379 │     │    9090    │  │  3001   │
└────────┘ └──────┘     └────────────┘  └─────────┘
```

### Domain Mapping

- **api.kemetra.org** → NestJS API Backend
- **admin.kemetra.org** → React Admin Dashboard (Static Files)
- **kemetra.org** (+ www) → Next.js Public Portal

---

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**: Minimum 2 cores (4+ recommended)
- **RAM**: Minimum 4GB (8GB+ recommended)
- **Disk**: Minimum 40GB SSD
- **Network**: Public IP address with open ports 80 and 443

### Software Requirements

- Docker Engine 20.10+ ([Installation Guide](https://docs.docker.com/engine/install/))
- Docker Compose V2 ([Installation Guide](https://docs.docker.com/compose/install/))
- Git

### DNS Configuration

Before deployment, configure DNS records:

```
api.kemetra.org     → A Record → Your Server IP
admin.kemetra.org   → A Record → Your Server IP
kemetra.org         → A Record → Your Server IP
www.kemetra.org     → CNAME   → kemetra.org
```

**Verify DNS propagation**: `dig api.kemetra.org` or use [whatsmydns.net](https://www.whatsmydns.net/)

---

## Pre-Deployment Checklist

- [ ] Server provisioned with sufficient resources
- [ ] Docker and Docker Compose installed
- [ ] DNS records configured and propagated
- [ ] Firewall rules configured (allow ports 80, 443, 22)
- [ ] SSH access configured
- [ ] Domain ownership verified for Let's Encrypt
- [ ] Email account ready for Let's Encrypt notifications

---

## Initial Setup

### 1. Clone Repositories

```bash
# Navigate to your projects directory
cd /opt

# Clone API repository
git clone <your-repo-url> EG_Antiq
cd EG_Antiq
git checkout main

# Clone Admin Frontend
cd ..
git clone <admin-repo-url> EG_Antiq_backend
cd EG_Antiq_backend
git checkout main

# Clone Portal Frontend
cd ..
git clone <portal-repo-url> EG_Antiq_portal
cd EG_Antiq_portal
git checkout main
```

### 2. Configure Environment Variables

```bash
cd /opt/EG_Antiq

# Copy example file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

**Critical values to change**:
```bash
# Database password
POSTGRES_PASSWORD=your-secure-password

# JWT secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-secret-here
PORTAL_JWT_SECRET=your-generated-secret-here

# Email configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# OAuth credentials (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Grafana admin password
GRAFANA_ADMIN_PASSWORD=your-grafana-password
```

### 3. Configure SSL Initialization Script

```bash
# Edit the init-letsencrypt.sh script
nano scripts/init-letsencrypt.sh
```

**Update the email address**:
```bash
email="your-email@example.com"  # Change this!
```

### 4. Build Frontend Production Builds (Optional Local Test)

```bash
# Admin Frontend
cd /opt/EG_Antiq_backend
npm ci
npm run build

# Portal Frontend
cd /opt/EG_Antiq_portal
npm ci
npm run build
```

---

## Deployment Steps

### Step 1: Build Docker Images

```bash
cd /opt/EG_Antiq

# Build all images
docker compose -f docker-compose.prod.yml build

# Expected build time: 10-15 minutes depending on server specs
```

### Step 2: Initialize Database

```bash
# Start only database and redis
docker compose -f docker-compose.prod.yml up -d postgres redis

# Wait for postgres to be ready (check with)
docker compose -f docker-compose.prod.yml logs postgres

# Run migrations
docker compose -f docker-compose.prod.yml run --rm api pnpm prisma:migrate:deploy

# Optional: Seed initial data
docker compose -f docker-compose.prod.yml run --rm api pnpm prisma:seed
```

### Step 3: Initialize SSL Certificates

```bash
# Make script executable (if not already)
chmod +x scripts/init-letsencrypt.sh

# Run the initialization script
./scripts/init-letsencrypt.sh
```

**This script will**:
1. Start nginx with HTTP-only configuration
2. Request certificates from Let's Encrypt for all domains
3. Reload nginx with SSL configuration

**Expected output**:
```
=== Let's Encrypt Certificate Initialization ===
Checking domain DNS configuration...
  ✓ api.kemetra.org DNS is configured
  ✓ admin.kemetra.org DNS is configured
  ✓ kemetra.org DNS is configured
...
✓ Certificate obtained successfully for api.kemetra.org
...
=== Initialization Complete ===
```

### Step 4: Start All Services

```bash
# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

**All services should show status: "Up" or "Up (healthy)"**

### Step 5: Verify Deployment

```bash
# Check API health
curl https://api.kemetra.org/api/v1/health
# Expected: {"status":"ok"}

# Check admin frontend
curl -I https://admin.kemetra.org
# Expected: HTTP/2 200

# Check portal frontend
curl -I https://kemetra.org
# Expected: HTTP/2 200

# Check SSL certificates
curl https://api.kemetra.org -v 2>&1 | grep "SSL certificate"
```

---

## Post-Deployment

### 1. Test Application Functionality

- [ ] Visit https://admin.kemetra.org - Admin should load
- [ ] Visit https://kemetra.org - Portal should load
- [ ] Test admin login with default credentials
- [ ] Test API endpoints via admin or Postman
- [ ] Test portal user registration and login
- [ ] Test OAuth login (Google, Facebook, Apple)

### 2. Configure Monitoring

```bash
# Access Grafana
# Visit: http://your-server-ip:3001
# Login: admin / your-grafana-password

# Import recommended dashboards:
# - Node Exporter Full (ID: 1860)
# - Docker Container Metrics (ID: 13639)

# Access Prometheus (for debugging)
# Visit: http://your-server-ip:9090
```

### 3. Security Hardening

#### Update firewall rules

```bash
# Using UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# Optional: Restrict SSH to specific IP
sudo ufw allow from YOUR_IP to any port 22
sudo ufw delete allow 22/tcp
```

#### Disable exposed Prometheus port (production)

Edit `docker-compose.prod.yml`:
```yaml
prometheus:
  # Comment out ports section to disable external access
  # ports:
  #   - '9090:9090'
```

#### Configure Grafana for external access (optional)

Add nginx configuration for monitoring subdomain:
```nginx
# /opt/EG_Antiq/nginx/conf.d/monitoring.conf
server {
    listen 443 ssl http2;
    server_name monitoring.kemetra.org;

    ssl_certificate /etc/letsencrypt/live/monitoring.kemetra.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.kemetra.org/privkey.pem;

    location / {
        proxy_pass http://grafana:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Monitoring

### Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f portal

# View logs with timestamps
docker compose -f docker-compose.prod.yml logs -f -t api
```

### Container Health

```bash
# Check all containers
docker compose -f docker-compose.prod.yml ps

# Check specific container health
docker inspect kemetra-api --format='{{.State.Health.Status}}'

# View health check logs
docker inspect kemetra-api --format='{{json .State.Health}}' | jq
```

### Metrics & Dashboards

- **Grafana**: http://your-server-ip:3001
- **Prometheus**: http://your-server-ip:9090
- **API Metrics**: https://api.kemetra.org/metrics

---

## Troubleshooting

### Common Issues

#### 1. SSL Certificate Failed

**Symptoms**: init-letsencrypt.sh fails to obtain certificates

**Solutions**:
```bash
# Check DNS resolution
dig api.kemetra.org

# Verify port 80 is accessible
curl http://api.kemetra.org/.well-known/acme-challenge/test

# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx

# Try staging mode first (edit init-letsencrypt.sh: staging=1)
./scripts/init-letsencrypt.sh
```

#### 2. API Container Crashes

**Symptoms**: API container keeps restarting

**Solutions**:
```bash
# Check API logs
docker compose -f docker-compose.prod.yml logs api

# Common causes:
# - Database connection failed (check DATABASE_URL)
# - Missing environment variables (check .env.production)
# - Prisma migration issues

# Test database connection
docker compose -f docker-compose.prod.yml exec api pnpm prisma:studio
```

#### 3. Admin Frontend Shows Blank Page

**Symptoms**: Admin loads but shows blank page or errors

**Solutions**:
```bash
# Check admin build output
ls -la /opt/EG_Antiq_backend/target

# Check nginx logs
docker compose -f docker-compose.prod.yml logs nginx

# Verify nginx is serving correct files
docker compose -f docker-compose.prod.yml exec nginx ls -la /usr/share/nginx/admin

# Rebuild admin container
docker compose -f docker-compose.prod.yml build admin
docker compose -f docker-compose.prod.yml up -d admin
```

#### 4. Portal 500 Errors

**Symptoms**: Portal shows 500 Internal Server Error

**Solutions**:
```bash
# Check portal logs
docker compose -f docker-compose.prod.yml logs portal

# Verify API URL is correct
docker compose -f docker-compose.prod.yml exec portal env | grep API

# Check Next.js standalone build
docker compose -f docker-compose.prod.yml exec portal ls -la .next/standalone
```

#### 5. High Memory Usage

**Symptoms**: Server running out of memory

**Solutions**:
```bash
# Check memory usage
docker stats

# Reduce Prometheus retention
# Edit docker-compose.prod.yml:
# --storage.tsdb.retention.time=15d

# Restart services with memory limits
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

---

## Maintenance

### Updating Application

```bash
cd /opt/EG_Antiq

# Pull latest changes
git pull origin main

# Rebuild images
docker compose -f docker-compose.prod.yml build

# Run migrations
docker compose -f docker-compose.prod.yml run --rm api pnpm prisma:migrate:deploy

# Restart services
docker compose -f docker-compose.prod.yml up -d

# Verify deployment
docker compose -f docker-compose.prod.yml ps
```

### Database Backup

```bash
# Backup database
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres Antiq_db | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Restore database
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres Antiq_db
```

### SSL Certificate Renewal

Certificates auto-renew via the certbot container. Manual renewal:

```bash
# Test renewal
docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run

# Force renewal
docker compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Updating Dependencies

```bash
# API
cd /opt/EG_Antiq
pnpm update
git add package.json pnpm-lock.yaml
git commit -m "chore: update dependencies"

# Admin Frontend
cd /opt/EG_Antiq_backend
npm update
git add package*.json
git commit -m "chore: update dependencies"

# Portal Frontend
cd /opt/EG_Antiq_portal
npm update
git add package*.json
git commit -m "chore: update dependencies"
```

### Monitoring Disk Space

```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a --volumes

# Keep only last 3 days of logs
find /var/lib/docker/containers -name "*.log" -mtime +3 -delete
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

## Support

For issues or questions:
1. Check logs: `docker compose -f docker-compose.prod.yml logs -f`
2. Review this troubleshooting section
3. Contact your DevOps team
