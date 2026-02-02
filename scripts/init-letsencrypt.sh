#!/bin/bash

# Initialize Let's Encrypt SSL certificates for all domains
# This script should be run once before starting the production stack

# Configuration
domains=(
  "api.kemetra.org"
  "admin.kemetra.org"
  "kemetra.org www.kemetra.org"
)
rsa_key_size=4096
data_path="./certbot"
email="your-email@example.com" # Change this!
staging=0 # Set to 1 for testing

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Let's Encrypt Certificate Initialization ===${NC}"
echo ""

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check if email is configured
if [ "$email" = "your-email@example.com" ]; then
    echo -e "${RED}Error: Please set your email address in this script${NC}"
    exit 1
fi

# Check if domains are reachable
echo -e "${YELLOW}Checking domain DNS configuration...${NC}"
for domain_set in "${domains[@]}"; do
    primary_domain=$(echo $domain_set | cut -d' ' -f1)
    echo "  Checking $primary_domain..."
    if ! host $primary_domain > /dev/null 2>&1; then
        echo -e "${RED}  Warning: $primary_domain DNS not configured or not reachable${NC}"
    else
        echo -e "${GREEN}  ✓ $primary_domain DNS is configured${NC}"
    fi
done
echo ""

# Create directories
echo -e "${YELLOW}Creating certificate directories...${NC}"
mkdir -p "$data_path/conf/live"
mkdir -p "$data_path/www"
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Download recommended TLS parameters
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
    echo -e "${YELLOW}Downloading recommended TLS parameters...${NC}"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
    echo -e "${GREEN}✓ TLS parameters downloaded${NC}"
else
    echo -e "${GREEN}✓ TLS parameters already exist${NC}"
fi
echo ""

# Create temporary nginx configuration without SSL
echo -e "${YELLOW}Creating temporary nginx configuration...${NC}"
cp nginx/nginx.conf nginx/nginx.conf.bak 2>/dev/null || true

# Start nginx with HTTP only for ACME challenge
echo -e "${YELLOW}Starting nginx for ACME challenge...${NC}"
docker compose -f docker-compose.prod.yml up -d nginx
sleep 5
echo -e "${GREEN}✓ Nginx started${NC}"
echo ""

# Request certificates for each domain set
for domain_set in "${domains[@]}"; do
    primary_domain=$(echo $domain_set | cut -d' ' -f1)

    echo -e "${YELLOW}Requesting certificate for: $domain_set${NC}"

    # Check if certificate already exists
    if [ -d "$data_path/conf/live/$primary_domain" ]; then
        echo -e "${YELLOW}Certificate already exists for $primary_domain. Skipping...${NC}"
        continue
    fi

    # Staging or production
    staging_arg=""
    if [ $staging != "0" ]; then
        staging_arg="--staging"
        echo -e "${YELLOW}Using Let's Encrypt staging environment (test mode)${NC}"
    fi

    # Build domain arguments
    domain_args=""
    for domain in $domain_set; do
        domain_args="$domain_args -d $domain"
    done

    # Request certificate
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        $staging_arg \
        --email $email \
        --rsa-key-size $rsa_key_size \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        $domain_args

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Certificate obtained successfully for $primary_domain${NC}"
    else
        echo -e "${RED}✗ Failed to obtain certificate for $primary_domain${NC}"
        echo -e "${YELLOW}  Common causes:${NC}"
        echo -e "${YELLOW}  - Domain DNS not pointing to this server${NC}"
        echo -e "${YELLOW}  - Port 80 not accessible from the internet${NC}"
        echo -e "${YELLOW}  - Firewall blocking connections${NC}"
    fi

    echo ""
done

# Reload nginx with SSL configuration
echo -e "${YELLOW}Reloading nginx with SSL configuration...${NC}"
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# Display certificate information
echo -e "${GREEN}=== Certificate Status ===${NC}"
for domain_set in "${domains[@]}"; do
    primary_domain=$(echo $domain_set | cut -d' ' -f1)
    if [ -d "$data_path/conf/live/$primary_domain" ]; then
        echo -e "${GREEN}✓ $primary_domain - Certificate exists${NC}"
        # Show expiry date
        expiry=$(docker compose -f docker-compose.prod.yml run --rm certbot certificates --cert-name $primary_domain 2>/dev/null | grep "Expiry Date" | cut -d: -f2-)
        if [ ! -z "$expiry" ]; then
            echo "  Expiry:$expiry"
        fi
    else
        echo -e "${RED}✗ $primary_domain - No certificate${NC}"
    fi
done
echo ""

echo -e "${GREEN}=== Initialization Complete ===${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify certificates are working: visit https://api.kemetra.org"
echo "2. Start all services: docker compose -f docker-compose.prod.yml up -d"
echo "3. Check logs: docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo -e "${YELLOW}Certificate renewal:${NC}"
echo "Certificates will auto-renew via the certbot container."
echo "Manual renewal: docker compose -f docker-compose.prod.yml run --rm certbot renew"
echo ""
