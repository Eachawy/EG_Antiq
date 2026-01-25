# Production Deployment Guide for api.kemetra.org

This guide will help you deploy the NestJS API backend to your production server with proper Nginx configuration and CORS support.

## Prerequisites

- Production server with Ubuntu/Debian Linux
- Root or sudo access
- Domain `api.kemetra.org` pointing to your server IP (153.92.209.167)
- SSL certificate (Let's Encrypt recommended)

## Step-by-Step Deployment

### 1. Prepare Your Production Server

SSH into your production server:

```bash
ssh root@153.92.209.167
# or
ssh your-user@153.92.209.167
```

### 2. Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
```

### 3. Clone Your Repository

```bash
# Navigate to your preferred directory
cd /root  # or /opt or /var/www

# Clone the repository
git clone https://github.com/your-repo/EG_Antiq.git
cd EG_Antiq
```

### 4. Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production.example .env.production

# Edit the file with production credentials
nano .env.production
```

**Important variables to set:**
- `DATABASE_PASSWORD` - Strong password for PostgreSQL
- `JWT_SECRET` - 64+ character secret (use: `openssl rand -base64 64`)
- `PORTAL_JWT_SECRET` - Different 64+ character secret
- `API_URL` - `https://api.kemetra.org`
- `CORS_ORIGINS` - All your frontend URLs
- `EMAIL_*` - Your email service credentials
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth credentials

### 5. Setup SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate for api.kemetra.org
sudo certbot certonly --standalone -d api.kemetra.org --email your-email@example.com --agree-tos --no-eff-email

# Start Nginx again
sudo systemctl start nginx
```

### 6. Deploy Nginx Configuration

```bash
# Remove any existing conflicting configuration
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/api.kemetra.org

# Copy the new configuration
sudo cp nginx-configs/api.kemetra.org.conf /etc/nginx/sites-available/

# Enable the site
sudo ln -s /etc/nginx/sites-available/api.kemetra.org.conf /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 7. Start Docker Containers

```bash
# Build and start the containers
docker compose -f docker-compose.production.yml --env-file .env.production up -d

# Check if containers are running
docker compose -f docker-compose.production.yml ps

# View logs
docker compose -f docker-compose.production.yml logs -f
```

### 8. Initialize Database

```bash
# Wait for containers to be healthy
sleep 30

# Run migrations
docker compose -f docker-compose.production.yml exec api pnpm prisma:migrate:deploy

# Seed initial data (optional)
docker compose -f docker-compose.production.yml exec api pnpm prisma:seed
```

### 9. Verify Deployment

Test the API endpoints:

```bash
# Health check
curl https://api.kemetra.org/api/v1/health

# API docs (should be accessible in browser)
# Visit: https://api.kemetra.org/api/docs

# Test CORS (from admin frontend)
# Login should now work from http://admin.kemetra.org
```

### 10. Setup Auto-Renewal for SSL

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job, but verify:
sudo systemctl status certbot.timer
```

## Updating Your Deployment

When you make code changes:

```bash
# SSH into server
ssh root@153.92.209.167
cd /root/EG_Antiq

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Run migrations if schema changed
docker compose -f docker-compose.production.yml exec api pnpm prisma:migrate:deploy
```

## Troubleshooting

### CORS Errors Still Occurring

1. Check Nginx configuration is loaded:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. Check if the origin is in the whitelist (line 8-14 in `api.kemetra.org.conf`)

3. Test preflight request:
   ```bash
   curl -I -X OPTIONS https://api.kemetra.org/api/v1/auth/login \
     -H "Origin: http://admin.kemetra.org" \
     -H "Access-Control-Request-Method: POST"
   ```

### API Not Responding

1. Check if containers are running:
   ```bash
   docker compose -f docker-compose.production.yml ps
   ```

2. Check logs:
   ```bash
   docker compose -f docker-compose.production.yml logs api
   ```

3. Check if API is listening on port 3000:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

### Database Connection Issues

1. Check database container:
   ```bash
   docker compose -f docker-compose.production.yml logs postgres
   ```

2. Verify connection string in `.env.production`:
   ```
   DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@postgres:5433/antiq_production?schema=public
   ```

## Backup Strategy

### Database Backups

```bash
# Manual backup
docker compose -f docker-compose.production.yml exec postgres pg_dump -U postgres antiq_production > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose -f docker-compose.production.yml exec -T postgres psql -U postgres antiq_production < backup_20260125.sql
```

### Automated Backups (Optional)

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /root/EG_Antiq && docker compose -f docker-compose.production.yml exec postgres pg_dump -U postgres antiq_production > /root/backups/antiq_$(date +\%Y\%m\%d).sql
```

## Security Checklist

- [ ] Strong database password (32+ characters)
- [ ] Unique JWT secrets (64+ characters, different from staging)
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW or iptables)
- [ ] Only necessary ports open (80, 443, 22)
- [ ] Database not exposed to public (127.0.0.1 binding)
- [ ] Regular backups automated
- [ ] `.env.production` not committed to git
- [ ] CORS origins limited to production domains only
- [ ] Monitoring and logging configured

## Monitoring

### View Logs

```bash
# API logs
docker compose -f docker-compose.production.yml logs -f api

# Nginx access logs
sudo tail -f /var/log/nginx/api.kemetra.org.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/api.kemetra.org.error.log
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
df -h

# Docker disk usage
docker system df
```

## Support

For issues or questions:
1. Check logs first
2. Verify all environment variables are set correctly
3. Test each component individually (nginx, docker, database)
4. Check firewall and port accessibility
