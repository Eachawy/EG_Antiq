# Nginx Configuration for Production

This directory contains the Nginx configuration for `api.kemetra.org` with CORS support.

## Files Created

1. **`api.kemetra.org.conf`** - Complete Nginx configuration with CORS headers
2. **`../PRODUCTION_DEPLOYMENT.md`** - Full deployment guide
3. **`../scripts/setup-nginx-production.sh`** - Automated setup script

## Quick Setup (On Production Server)

### Option 1: Automated Setup (Recommended)

```bash
# 1. Copy project to production server
git clone <your-repo> /root/EG_Antiq
cd /root/EG_Antiq

# 2. Run the setup script
sudo ./scripts/setup-nginx-production.sh
```

### Option 2: Manual Setup

```bash
# 1. Copy configuration to Nginx
sudo cp nginx-configs/api.kemetra.org.conf /etc/nginx/sites-available/

# 2. Enable the site
sudo ln -s /etc/nginx/sites-available/api.kemetra.org.conf /etc/nginx/sites-enabled/

# 3. Remove default site (if exists)
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test configuration
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx
```

## What This Configuration Does

✅ **CORS Support**: Allows requests from admin.kemetra.org and other whitelisted domains
✅ **Handles Preflight**: Properly responds to OPTIONS requests
✅ **SSL/HTTPS**: Configured for Let's Encrypt certificates
✅ **Security Headers**: HSTS, X-Frame-Options, CSP, etc.
✅ **Proxies to API**: Forwards requests to localhost:3000
✅ **API Documentation**: `/api/docs` accessible
✅ **File Uploads**: Serves uploaded images with CORS
✅ **Health Checks**: `/health` endpoint for monitoring

## Allowed CORS Origins

The configuration allows requests from:
- `http://localhost:*` and `https://localhost:*`
- `http://kemetra.org` and `https://kemetra.org`
- `http://www.kemetra.org` and `https://www.kemetra.org`
- `http://admin.kemetra.org` and `https://admin.kemetra.org`
- `http://api.kemetra.org` and `https://api.kemetra.org`
- `http://153.92.209.167:*` and `https://153.92.209.167:*`

To add more origins, edit the `map $http_origin $cors_origin` section in the config file.

## SSL Certificate Setup

If you don't have an SSL certificate yet:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d api.kemetra.org \
  --email your-email@example.com \
  --agree-tos --no-eff-email

# Start Nginx
sudo systemctl start nginx
```

The certificate will be saved to:
- Certificate: `/etc/letsencrypt/live/api.kemetra.org/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/api.kemetra.org/privkey.pem`

Auto-renewal is configured automatically by Certbot.

## Testing

After setup, test the configuration:

```bash
# 1. Test health endpoint
curl https://api.kemetra.org/api/v1/health

# 2. Test CORS preflight
curl -I -X OPTIONS https://api.kemetra.org/api/v1/auth/login \
  -H "Origin: http://admin.kemetra.org" \
  -H "Access-Control-Request-Method: POST"

# Should return:
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: http://admin.kemetra.org
# Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# Access-Control-Allow-Credentials: true

# 3. View logs
sudo tail -f /var/log/nginx/api.kemetra.org.access.log
```

## Troubleshooting

### CORS errors still occurring?

1. Check if Nginx reloaded: `sudo systemctl status nginx`
2. Check error logs: `sudo tail -f /var/log/nginx/api.kemetra.org.error.log`
3. Verify origin is in whitelist (line 8-14 of config file)
4. Clear browser cache and try again

### 502 Bad Gateway?

The API at localhost:3000 is not running:

```bash
# Check if API container is running
docker compose -f docker-compose.production.yml ps

# Check API logs
docker compose -f docker-compose.production.yml logs api

# Test direct connection
curl http://localhost:3000/api/v1/health
```

### 404 Not Found for /api/docs?

The API might not be running or the path is incorrect:

```bash
# Test if API is accessible
curl http://localhost:3000/api/docs

# Check if the route exists in your NestJS app
docker compose -f docker-compose.production.yml exec api pnpm start
```

## Configuration Updates

When you need to update the configuration:

```bash
# 1. Edit the config file
sudo nano /etc/nginx/sites-available/api.kemetra.org.conf

# 2. Test changes
sudo nginx -t

# 3. If test passes, reload
sudo systemctl reload nginx
```

## Complete Deployment

For full production deployment including Docker, database, and SSL:

📖 See **[PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md)** for the complete guide.
