#!/bin/bash

##############################################################################
# Nginx Setup Script for api.kemetra.org (Production)
#
# This script sets up the Nginx configuration for the production API
# Usage: sudo ./scripts/setup-nginx-production.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Nginx Setup for api.kemetra.org${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    exit 1
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Nginx not found. Installing...${NC}"
    apt update
    apt install nginx -y
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx is already installed${NC}"
fi

# Check if configuration file exists
if [ ! -f "nginx-configs/api.kemetra.org.conf" ]; then
    echo -e "${RED}Error: nginx-configs/api.kemetra.org.conf not found!${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Backing up existing configuration...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -f "/etc/nginx/sites-available/api.kemetra.org.conf" ]; then
    cp /etc/nginx/sites-available/api.kemetra.org.conf /etc/nginx/sites-available/api.kemetra.org.conf.backup_$TIMESTAMP
    echo -e "${GREEN}✓ Existing config backed up to api.kemetra.org.conf.backup_$TIMESTAMP${NC}"
else
    echo -e "${YELLOW}! No existing configuration found${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Installing new Nginx configuration...${NC}"
cp nginx-configs/api.kemetra.org.conf /etc/nginx/sites-available/
echo -e "${GREEN}✓ Configuration copied to /etc/nginx/sites-available/${NC}"

echo ""
echo -e "${YELLOW}Step 3: Removing conflicting configurations...${NC}"
# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✓ Removed default site${NC}"
fi

# Remove old api.kemetra.org symlink if exists
if [ -L "/etc/nginx/sites-enabled/api.kemetra.org.conf" ]; then
    rm /etc/nginx/sites-enabled/api.kemetra.org.conf
    echo -e "${GREEN}✓ Removed old symlink${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Enabling new configuration...${NC}"
ln -sf /etc/nginx/sites-available/api.kemetra.org.conf /etc/nginx/sites-enabled/
echo -e "${GREEN}✓ Configuration enabled${NC}"

echo ""
echo -e "${YELLOW}Step 5: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration test passed${NC}"
else
    echo -e "${RED}Error: Nginx configuration test failed!${NC}"
    echo -e "${YELLOW}Restoring backup...${NC}"
    if [ -f "/etc/nginx/sites-available/api.kemetra.org.conf.backup_$TIMESTAMP" ]; then
        cp /etc/nginx/sites-available/api.kemetra.org.conf.backup_$TIMESTAMP /etc/nginx/sites-available/api.kemetra.org.conf
        ln -sf /etc/nginx/sites-available/api.kemetra.org.conf /etc/nginx/sites-enabled/
        echo -e "${GREEN}✓ Backup restored${NC}"
    fi
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 6: Checking SSL certificates...${NC}"
if [ -f "/etc/letsencrypt/live/api.kemetra.org/fullchain.pem" ]; then
    echo -e "${GREEN}✓ SSL certificate found${NC}"
else
    echo -e "${RED}⚠ SSL certificate not found!${NC}"
    echo ""
    echo "To obtain an SSL certificate, run:"
    echo "  sudo systemctl stop nginx"
    echo "  sudo certbot certonly --standalone -d api.kemetra.org --email your-email@example.com --agree-tos"
    echo "  sudo systemctl start nginx"
    echo ""
    echo -e "${YELLOW}Continuing anyway...${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Reloading Nginx...${NC}"
if systemctl reload nginx; then
    echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
else
    echo -e "${RED}Error: Failed to reload Nginx${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Nginx Setup Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuration details:"
echo "  - Server name: api.kemetra.org"
echo "  - HTTP: Port 80 (redirects to HTTPS)"
echo "  - HTTPS: Port 443"
echo "  - Upstream: localhost:3000"
echo "  - Logs: /var/log/nginx/api.kemetra.org.*.log"
echo ""
echo "CORS enabled for:"
echo "  - admin.kemetra.org"
echo "  - kemetra.org"
echo "  - api.kemetra.org"
echo "  - localhost (all ports)"
echo "  - 153.92.209.167 (all ports)"
echo ""
echo "Next steps:"
echo "  1. Make sure your API is running: docker compose -f docker-compose.production.yml ps"
echo "  2. Test the API: curl https://api.kemetra.org/api/v1/health"
echo "  3. Test CORS: curl -I -X OPTIONS https://api.kemetra.org/api/v1/auth/login -H 'Origin: http://admin.kemetra.org'"
echo "  4. Check logs: sudo tail -f /var/log/nginx/api.kemetra.org.access.log"
echo ""
echo -e "${BLUE}Configuration backup saved at:${NC}"
echo "  /etc/nginx/sites-available/api.kemetra.org.conf.backup_$TIMESTAMP"
echo ""
