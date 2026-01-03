# Hostinger VPS Deployment Guide

## Your Setup

- **Server IP**: 153.92.209.167
- **API URL**: http://153.92.209.167:3000
- **Admin Frontend URL**: http://153.92.209.167:3001

## Quick Deployment

### On Your Hostinger VPS

```bash
cd /root/EG_Antiq

# 1. Run the automated deployment script
./scripts/deploy-hostinger.sh
```

That's it! The script will:
1. ✅ Build API Docker image
2. ✅ Build Admin Frontend Docker image
3. ✅ Start PostgreSQL & Redis
4. ✅ Initialize database
5. ✅ Start API on port 3000
6. ✅ Start Admin Frontend on port 3001

## Configure Firewall

### In Hostinger Control Panel

1. Go to: https://hpanel.hostinger.com
2. Click **VPS** → Your VPS → **Firewall**
3. Add these rules:

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 3000 | TCP | 0.0.0.0/0 | API Server |
| 3001 | TCP | 0.0.0.0/0 | Admin Frontend |

4. Click **Save**

## Verify Deployment

### 1. Check Containers

```bash
docker compose -f docker-compose.production.yml ps
```

**Expected output:**
```
NAME                    STATUS
production-postgres     Up (healthy)
production-redis        Up (healthy)
production-api          Up (healthy)
production-frontend     Up (healthy)
```

### 2. Test API

```bash
curl http://153.92.209.167:3000/api/v1/health
```

**Expected:** `{"status":"ok"}`

### 3. Test Frontend

Open in browser: http://153.92.209.167:3001

**Expected:** Login page

## Default Login

```
Email:    admin@example.com
Password: Admin123!
```

**⚠️ IMPORTANT:** Change these credentials immediately after first login!

## Manual Deployment Steps

If you prefer manual deployment:

### 1. Update .env

```bash
cd /root/EG_Antiq

# Add CORS configuration
nano .env
```

Add this line:
```bash
CORS_ORIGIN=http://153.92.209.167:3001,http://localhost:3001
```

### 2. Build Images

```bash
# Build API
docker compose -f docker-compose.production.yml build api

# Build Frontend
docker compose -f docker-compose.production.yml build frontend
```

### 3. Start Services

```bash
# Start database
docker compose -f docker-compose.production.yml up -d postgres redis
sleep 20

# Initialize database
docker compose -f docker-compose.production.yml run --rm api pnpm --filter @packages/database prisma db push

# Start API and Frontend
docker compose -f docker-compose.production.yml up -d api frontend
```

### 4. Verify

```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f
```

## Troubleshooting

### Frontend Can't Connect to API

**Symptom:** Login button does nothing, or CORS errors in browser console

**Solution:**

```bash
# 1. Check .env has CORS_ORIGIN
grep CORS_ORIGIN .env

# 2. Should see:
# CORS_ORIGIN=http://153.92.209.167:3001,http://localhost:3001

# 3. If missing, add it:
echo "CORS_ORIGIN=http://153.92.209.167:3001,http://localhost:3001" >> .env

# 4. Restart API
docker compose -f docker-compose.production.yml restart api
```

### Port Not Accessible

**Symptom:** "Connection refused" when accessing URLs

**Solution:**

```bash
# 1. Check if ports are listening
netstat -tlnp | grep -E '3000|3001'

# Expected:
# tcp6 0 0 :::3000  :::*  LISTEN
# tcp6 0 0 :::3001  :::*  LISTEN

# 2. Check firewall (if using firewalld)
sudo firewall-cmd --list-ports

# 3. Open ports if needed
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### Container Not Starting

```bash
# Check logs
docker compose -f docker-compose.production.yml logs frontend
docker compose -f docker-compose.production.yml logs api

# Rebuild if needed
docker compose -f docker-compose.production.yml build --no-cache frontend
docker compose -f docker-compose.production.yml up -d frontend
```

## Update Frontend Code

When you change the admin frontend code:

```bash
cd /root/EG_Antiq

# Pull latest code
git pull

# Rebuild frontend only
docker compose -f docker-compose.production.yml build --no-cache frontend

# Restart frontend
docker compose -f docker-compose.production.yml up -d frontend

# Check logs
docker compose -f docker-compose.production.yml logs -f frontend
```

## Update API Code

When you change the backend API code:

```bash
cd /root/EG_Antiq

# Pull latest code
git pull

# Rebuild API
docker compose -f docker-compose.production.yml build --no-cache api

# Restart API
docker compose -f docker-compose.production.yml restart api

# Check logs
docker compose -f docker-compose.production.yml logs -f api
```

## Useful Commands

```bash
# View all logs
docker compose -f docker-compose.production.yml logs -f

# View specific service logs
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f frontend

# Restart a service
docker compose -f docker-compose.production.yml restart api
docker compose -f docker-compose.production.yml restart frontend

# Check status
docker compose -f docker-compose.production.yml ps

# Stop all services
docker compose -f docker-compose.production.yml down

# Start all services
docker compose -f docker-compose.production.yml up -d

# Remove and rebuild everything
docker compose -f docker-compose.production.yml down -v
./scripts/deploy-hostinger.sh
```

## Architecture

```
Internet
   ↓
Your Browser → http://153.92.209.167:3001 (Admin Frontend - React App)
                           ↓
                    Makes API calls to
                           ↓
              http://153.92.209.167:3000 (API Server - NestJS)
                           ↓
                   PostgreSQL (port 5433)
                   Redis (port 6379)
```

## Security Recommendations

1. **Change default admin password** immediately
2. **Use HTTPS** - Setup SSL with Let's Encrypt (see SSL section below)
3. **Restrict firewall** - Only allow necessary ports
4. **Regular backups** - Run `./scripts/backup.sh` daily
5. **Update secrets** - Change DATABASE_PASSWORD, JWT_SECRET in production

## Setup SSL (Optional but Recommended)

### 1. Point Domain to Server

In your domain registrar, add A record:
```
@ or www → 153.92.209.167
```

### 2. Update .env

```bash
nano .env
```

Add:
```bash
DOMAIN=yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Run SSL Setup

```bash
./scripts/setup-ssl.sh
```

### 4. Access via HTTPS

- API: https://yourdomain.com/api/v1
- Frontend: https://yourdomain.com

## Support

If you encounter issues:

1. **Check logs**: `docker compose -f docker-compose.production.yml logs -f`
2. **Run diagnostics**: `./scripts/diagnose.sh`
3. **Restart services**: `docker compose -f docker-compose.production.yml restart`
4. **Fresh deployment**: `./scripts/deploy-hostinger.sh`
