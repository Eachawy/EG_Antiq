#!/bin/bash
# ============================================================================
# Automated NGINX Deployment Script for Kemetra
# ============================================================================
# This script will:
# 1. Install system NGINX if not present
# 2. Deploy the gateway configuration
# 3. Verify all services are working
# ============================================================================

set -e  # Exit on error

echo "============================================"
echo "Kemetra NGINX Deployment Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================
echo "Step 1: Checking prerequisites..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_status "Running as root"

# Check if repositories exist
if [ ! -d "/root/EG_Antiq" ]; then
    print_error "EG_Antiq repository not found at /root/EG_Antiq"
    exit 1
fi
print_status "EG_Antiq repository found"

if [ ! -d "/root/EG_Antiq_backend" ]; then
    print_error "EG_Antiq_backend repository not found"
    exit 1
fi
print_status "EG_Antiq_backend repository found"

if [ ! -d "/root/EG_Antiq_portal" ]; then
    print_error "EG_Antiq_portal repository not found"
    exit 1
fi
print_status "EG_Antiq_portal repository found"

echo ""

# ============================================================================
# Step 2: Check Docker Containers
# ============================================================================
echo "Step 2: Checking Docker containers..."

# Check if containers are running
ADMIN_NGINX=$(docker ps --filter "name=admin-nginx" --format "{{.Names}}" | head -1)
PORTAL_NGINX=$(docker ps --filter "name=portal-nginx" --format "{{.Names}}" | head -1)
API=$(docker ps --filter "name=production-api" --format "{{.Names}}" | head -1)

if [ -z "$ADMIN_NGINX" ]; then
    print_warning "admin-nginx container not running. Starting it..."
    cd /root/EG_Antiq_backend
    docker compose -f docker-compose.production.yml up -d
    sleep 5
else
    print_status "admin-nginx is running"
fi

if [ -z "$PORTAL_NGINX" ]; then
    print_warning "portal-nginx container not running. Starting it..."
    cd /root/EG_Antiq_portal
    docker compose -f docker-compose.production.yml up -d
    sleep 5
else
    print_status "portal-nginx is running"
fi

if [ -z "$API" ]; then
    print_warning "API container not running. Starting it..."
    cd /root/EG_Antiq
    docker compose -f docker-compose.production.yml up -d
    sleep 5
else
    print_status "API is running"
fi

echo ""

# ============================================================================
# Step 3: Install NGINX if Not Present
# ============================================================================
echo "Step 3: Installing/checking system NGINX..."

if ! command -v nginx &> /dev/null; then
    print_warning "NGINX not found. Installing..."
    dnf update -qq
    dnf install nginx -y
    print_status "NGINX installed successfully"
else
    print_status "NGINX already installed ($(nginx -v 2>&1 | cut -d'/' -f2))"
fi

# Enable NGINX to start on boot
systemctl enable nginx

echo ""

# ============================================================================
# Step 4: Check SSL Certificates
# ============================================================================
echo "Step 4: Checking SSL certificates..."

if [ ! -f "/etc/letsencrypt/live/kemetra.org/fullchain.pem" ]; then
    print_error "SSL certificate not found at /etc/letsencrypt/live/kemetra.org/"
    print_warning "Please generate certificates first:"
    echo ""
    echo "  sudo systemctl stop nginx"
    echo "  sudo certbot certonly --standalone \\"
    echo "    -d kemetra.org \\"
    echo "    -d www.kemetra.org \\"
    echo "    -d admin.kemetra.org \\"
    echo "    -d api.kemetra.org \\"
    echo "    --email admin@kemetra.org \\"
    echo "    --agree-tos"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check certificate domains
CERT_DOMAINS=$(openssl x509 -in /etc/letsencrypt/live/kemetra.org/fullchain.pem -text -noout | grep "DNS:" | head -1)
print_status "SSL certificate found"
echo "    Domains: $CERT_DOMAINS"

# Verify required domains
if ! echo "$CERT_DOMAINS" | grep -q "api.kemetra.org"; then
    print_warning "api.kemetra.org not in certificate. You may need to regenerate it."
fi

if ! echo "$CERT_DOMAINS" | grep -q "admin.kemetra.org"; then
    print_warning "admin.kemetra.org not in certificate. You may need to regenerate it."
fi

echo ""

# ============================================================================
# Step 5: Deploy NGINX Configuration
# ============================================================================
echo "Step 5: Deploying NGINX configuration..."

# Check if gateway Admin config exists
if [ ! -f "/root/EG_Antiq_backend/nginx-configs/admin.kemetra.org.conf" ]; then
    print_error "Gateway configuration not found at /root/EG_Antiq_backend/nginx-configs/admin.kemetra.org.conf"
    print_warning "Did you run 'git pull' in /root/EG_Antiq_backend?"
    exit 1
fi

# Copy Admin configuration
cp /root/EG_Antiq_backend/nginx-configs/admin.kemetra.org.conf /etc/nginx/sites-available/
print_status "Configuration copied to /etc/nginx/sites-available/"

# Check if gateway Portal config exists
if [ ! -f "/root/EG_Antiq_portal/nginx-configs/kemetra.org.conf" ]; then
    print_error "Gateway configuration not found at /root/EG_Antiq_portal/nginx-configs/kemetra.org.conf"
    print_warning "Did you run 'git pull' in /root/EG_Antiq_portal?"
    exit 1
fi

# Copy Admin configuration
cp /root/EG_Antiq_portal/nginx-configs/kemetra.org.conf /etc/nginx/sites-available/
print_status "Configuration copied to /etc/nginx/sites-available/"

# Remove default config if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm -f /etc/nginx/sites-enabled/default
    print_status "Removed default configuration"
fi

# Enable gateway configuration
ln -sf /etc/nginx/sites-available/kemetra-gateway.conf /etc/nginx/sites-enabled/
print_status "Gateway configuration enabled"

echo ""

# ============================================================================
# Step 6: Test NGINX Configuration
# ============================================================================
echo "Step 6: Testing NGINX configuration..."

if nginx -t 2>&1 | grep -q "syntax is ok"; then
    print_status "NGINX configuration syntax is valid"
else
    print_error "NGINX configuration test failed:"
    nginx -t
    exit 1
fi

echo ""

# ============================================================================
# Step 7: Reload NGINX
# ============================================================================
echo "Step 7: Reloading NGINX..."

systemctl reload nginx

if systemctl is-active --quiet nginx; then
    print_status "NGINX reloaded successfully"
else
    print_error "NGINX failed to start"
    systemctl status nginx
    exit 1
fi

echo ""

# ============================================================================
# Step 8: Verify Port Bindings
# ============================================================================
echo "Step 8: Verifying port bindings..."

echo "Ports in use:"
ss -tulpn | grep -E ':(80|443|3000|8002|8003|8445|8446)' | awk '{print "  " $5}' | sort -u

echo ""

# Check critical ports
if ss -tulpn | grep -q ":80 "; then
    print_status "Port 80 (HTTP) is listening"
else
    print_error "Port 80 is not listening"
fi

if ss -tulpn | grep -q ":443 "; then
    print_status "Port 443 (HTTPS) is listening"
else
    print_error "Port 443 is not listening"
fi

if ss -tulpn | grep -q ":8445 "; then
    print_status "Port 8445 (Admin HTTPS) is listening"
else
    print_warning "Port 8445 (Admin HTTPS) is not listening"
fi

if ss -tulpn | grep -q ":8446 "; then
    print_status "Port 8446 (Portal HTTPS) is listening"
else
    print_warning "Port 8446 (Portal HTTPS) is not listening"
fi

echo ""

# ============================================================================
# Step 9: Test Services
# ============================================================================
echo "Step 9: Testing service health..."

# Test API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
    print_status "API health check: OK ($API_STATUS)"
else
    print_warning "API health check: FAILED ($API_STATUS)"
fi

# Test Admin NGINX
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k https://localhost:8445/nginx-health 2>/dev/null || echo "000")
if [ "$ADMIN_STATUS" = "200" ]; then
    print_status "Admin NGINX health check: OK ($ADMIN_STATUS)"
else
    print_warning "Admin NGINX health check: FAILED ($ADMIN_STATUS)"
fi

# Test Portal NGINX
PORTAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -k https://localhost:8446/nginx-health 2>/dev/null || echo "000")
if [ "$PORTAL_STATUS" = "200" ]; then
    print_status "Portal NGINX health check: OK ($PORTAL_STATUS)"
else
    print_warning "Portal NGINX health check: FAILED ($PORTAL_STATUS)"
fi

# Test host NGINX routing
ROUTING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: api.kemetra.org" http://127.0.0.1:80 2>/dev/null || echo "000")
if [ "$ROUTING_STATUS" = "301" ] || [ "$ROUTING_STATUS" = "302" ]; then
    print_status "Host NGINX routing: OK (redirecting to HTTPS)"
else
    print_warning "Host NGINX routing: Unexpected status ($ROUTING_STATUS)"
fi

echo ""

# ============================================================================
# Step 10: Summary
# ============================================================================
echo "============================================"
echo "Deployment Summary"
echo "============================================"
echo ""
echo "Services Status:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(admin|portal|api|NAME)"
echo ""
echo "NGINX Status:"
systemctl status nginx --no-pager | head -3
echo ""
echo "Next Steps:"
echo "1. Test from external machine:"
echo "   curl -I https://api.kemetra.org/api/v1/health"
echo "   curl -I https://admin.kemetra.org/"
echo "   curl -I https://kemetra.org/"
echo ""
echo "2. Test direct IP:port access:"
echo "   curl -I -k https://153.92.209.167:8445/"
echo "   curl -I -k https://153.92.209.167:8446/"
echo ""
echo "3. Check logs if issues:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo "   docker compose -f /root/EG_Antiq_backend/docker-compose.production.yml logs -f nginx"
echo ""
echo "============================================"
print_status "Deployment completed successfully!"
echo "============================================"
