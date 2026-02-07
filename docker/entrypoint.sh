#!/bin/sh

# Ensure upload directories exist with correct permissions
mkdir -p /app/uploads/gallery
mkdir -p /app/uploads/content/images

# Fix permissions (this script runs as root, then switches to nestjs user)
chown -R nestjs:nodejs /app/uploads
chmod -R 755 /app/uploads

# Execute the main command (passed as arguments to this script)
exec "$@"
