# Development Dockerfile - Optimized for hot reload and debugging
FROM node:20-alpine

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

# Install all dependencies (including devDependencies for development)
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY packages/database ./packages/database
COPY packages/common ./packages/common
COPY packages/logger ./packages/logger
COPY apps/api ./apps/api

# Copy templates directory
COPY apps/api/templates ./apps/api/templates

# Set NODE_ENV to development
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start development server with hot reload
CMD ["pnpm", "--filter", "@app/api", "dev"]
