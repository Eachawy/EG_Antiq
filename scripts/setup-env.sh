#!/bin/bash

# ==========================================
# Production Environment Setup Script
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Production Environment Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo -e "${YELLOW}Warning: .env file already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
        exit 0
    fi
fi

# Check if .env.production.example exists
if [ ! -f .env.production.example ]; then
    echo -e "${RED}Error: .env.production.example not found!${NC}"
    exit 1
fi

echo -e "${BLUE}Generating secure secrets...${NC}"

# Generate secrets
# JWT secrets can have any base64 characters (not used in URLs)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
PORTAL_JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')

# Database passwords must be URL-safe (used in DATABASE_URL)
# Generate alphanumeric passwords (no special chars that break URLs)
DATABASE_PASSWORD=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -hex 32)

echo -e "${GREEN}✓ Secrets generated${NC}"
echo ""

# Get domain information
echo -e "${YELLOW}Optional: Domain Configuration (for SSL)${NC}"
read -p "Enter your domain name (or press Enter to skip): " DOMAIN
if [ -n "$DOMAIN" ]; then
    read -p "Enter admin email for SSL certificates: " ADMIN_EMAIL
fi

# Create .env file
echo -e "${BLUE}Creating .env file...${NC}"

cat > .env << EOF
# ==========================================
# Production Environment Configuration
# Generated: $(date)
# ==========================================

# Node Environment
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://postgres:${DATABASE_PASSWORD}@postgres:5433/antiq_production?schema=public
DATABASE_PASSWORD=${DATABASE_PASSWORD}

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Portal JWT Authentication (separate secret for portal users)
PORTAL_JWT_SECRET=${PORTAL_JWT_SECRET}
PORTAL_JWT_EXPIRES_IN=15m
PORTAL_REFRESH_TOKEN_EXPIRES_IN=30d

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# API Configuration
API_PORT=3000
API_PREFIX=api/v1

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=http://localhost,https://yourdomain.com
EOF

# Add domain configuration if provided
if [ -n "$DOMAIN" ]; then
    cat >> .env << EOF

# Domain Configuration (for SSL)
DOMAIN=${DOMAIN}
ADMIN_EMAIL=${ADMIN_EMAIL}
EOF
fi

# Add optional configurations
cat >> .env << EOF

# Optional: Email Configuration (for password reset, notifications)
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_SECURE=false
# MAIL_USER=noreply@yourdomain.com
# MAIL_PASSWORD=your-app-password
# MAIL_FROM=Ancient Egypt Portal <noreply@yourdomain.com>

# Optional: OAuth Configuration
# GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# FACEBOOK_APP_ID=your-facebook-app-id
# FACEBOOK_APP_SECRET=your-facebook-app-secret
# APPLE_CLIENT_ID=com.yourapp.service
# APPLE_TEAM_ID=your-apple-team-id
# APPLE_KEY_ID=your-apple-key-id
# APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey.p8

# Optional: File Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# Optional: Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF

echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# Set secure permissions
chmod 600 .env
echo -e "${GREEN}✓ Secure permissions set (600)${NC}"
echo ""

# Display summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Configuration Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Database Password: ${YELLOW}[HIDDEN - stored in .env]${NC}"
echo -e "JWT Secret: ${YELLOW}[HIDDEN - stored in .env]${NC}"
echo -e "Portal JWT Secret: ${YELLOW}[HIDDEN - stored in .env]${NC}"
echo -e "Redis Password: ${YELLOW}[HIDDEN - stored in .env]${NC}"

if [ -n "$DOMAIN" ]; then
    echo -e "Domain: ${GREEN}${DOMAIN}${NC}"
    echo -e "Admin Email: ${GREEN}${ADMIN_EMAIL}${NC}"
fi

echo ""
echo -e "${YELLOW}IMPORTANT NOTES:${NC}"
echo -e "1. Your .env file contains sensitive secrets - keep it secure!"
echo -e "2. Never commit .env to version control"
echo -e "3. Make a backup: ${BLUE}cp .env .env.backup${NC}"
echo -e "4. To enable email/OAuth, edit .env and uncomment/configure those sections"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo -e "1. Review .env file: ${BLUE}nano .env${NC}"
echo -e "2. Deploy application: ${BLUE}./scripts/deploy.sh${NC}"
echo ""
