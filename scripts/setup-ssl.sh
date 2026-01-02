#!/bin/bash

# ==========================================
# SSL Certificate Setup Script (Let's Encrypt)
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL Certificate Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

source .env

# Validate required variables
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: DOMAIN not set in .env${NC}"
    exit 1
fi

if [ -z "$ADMIN_EMAIL" ]; then
    echo -e "${RED}Error: ADMIN_EMAIL not set in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}Domain: ${GREEN}$DOMAIN${NC}"
echo -e "${YELLOW}Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo ""

read -p "Continue with SSL setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo -e "${YELLOW}Step 1: Obtaining SSL certificate...${NC}"
docker compose -f docker-compose.production.yml --profile ssl-setup run --rm certbot

echo -e "${GREEN}✓ Certificate obtained${NC}"
echo ""

echo -e "${YELLOW}Step 2: Updating Nginx configuration for HTTPS...${NC}"
echo "Please uncomment the HTTPS server block in docker/nginx/nginx.conf"
echo "Then restart Nginx with: docker compose -f docker-compose.production.yml restart nginx"
echo ""

echo -e "${YELLOW}Step 3: Setting up auto-renewal...${NC}"
echo "Adding cron job for certificate renewal..."

# Create renewal script
cat > scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
docker compose -f docker-compose.production.yml run --rm certbot renew
docker compose -f docker-compose.production.yml restart nginx
EOF

chmod +x scripts/renew-ssl.sh

echo -e "${GREEN}✓ Renewal script created: scripts/renew-ssl.sh${NC}"
echo ""
echo "To setup auto-renewal, add this to crontab (sudo crontab -e):"
echo -e "${YELLOW}0 0 * * * /path/to/scripts/renew-ssl.sh >> /var/log/letsencrypt-renew.log 2>&1${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
