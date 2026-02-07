# Production Dockerfile - Multi-stage build for optimized image size
# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Enable corepack and set pnpm version
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Set working directory
WORKDIR /app

# Copy package files and configs
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/common/package.json ./packages/common/
COPY packages/logger/package.json ./packages/logger/
COPY apps/api/package.json ./apps/api/

# Copy Prisma schema before install (needed for postinstall script)
COPY packages/database/prisma ./packages/database/prisma

# Install dependencies (includes dev deps needed for postinstall scripts)
RUN pnpm install --frozen-lockfile

# Install dev dependencies in separate layer for build stage
FROM node:20-alpine AS build-dependencies

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Enable corepack and set pnpm version
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/common/package.json ./packages/common/
COPY packages/logger/package.json ./packages/logger/
COPY apps/api/package.json ./apps/api/

# Copy Prisma schema
COPY packages/database/prisma ./packages/database/prisma

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM build-dependencies AS builder

WORKDIR /app

# Copy all source code
COPY packages/database ./packages/database
COPY packages/common ./packages/common
COPY packages/logger ./packages/logger
COPY apps/api ./apps/api

# Copy templates directory
COPY apps/api/templates ./apps/api/templates

# Build the application
RUN pnpm --filter @app/api build

# Generate Prisma Client
RUN pnpm --filter @packages/database prisma:generate

# Stage 3: Runtime
FROM node:20-alpine AS production

# Install OpenSSL for Prisma, curl for healthcheck, and su-exec for user switching
RUN apk add --no-cache openssl curl su-exec

# Enable corepack
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nestjs:nodejs package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY --chown=nestjs:nodejs packages/database/package.json ./packages/database/
COPY --chown=nestjs:nodejs packages/common/package.json ./packages/common/
COPY --chown=nestjs:nodejs packages/logger/package.json ./packages/logger/
COPY --chown=nestjs:nodejs apps/api/package.json ./apps/api/

# Copy full workspace from builder (pnpm symlinks need the complete structure)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/common ./packages/common
COPY --from=builder --chown=nestjs:nodejs /app/packages/logger ./packages/logger
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules

# Copy built application from builder stage (NestJS outputs to root /app/dist)
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/prisma ./packages/database/prisma

# Copy templates directory (needed at runtime for emails)
COPY --chown=nestjs:nodejs apps/api/templates ./templates

# Copy and set up entrypoint script (must be owned by root to fix permissions)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Set NODE_ENV to production
ENV NODE_ENV=production
# pnpm workspace: dist is at root but deps are in apps/api/node_modules
ENV NODE_PATH=/app/apps/api/node_modules

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Use entrypoint script to fix permissions before starting app
ENTRYPOINT ["/entrypoint.sh"]

# Start the application (dist contains workspace structure)
# Note: Container starts as root, entrypoint fixes permissions, then switches to nestjs user
CMD ["su-exec", "nestjs", "node", "dist/apps/api/src/main.js"]
