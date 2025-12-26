# Stage 1: Builder - Install dependencies and build
FROM node:20-alpine AS builder

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

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of source code
COPY packages/common ./packages/common
COPY packages/logger ./packages/logger
COPY apps/api/ ./apps/api/

# Build all packages
RUN pnpm build

# Stage 2: Production - Run the application
FROM node:20-alpine AS production

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Enable corepack and set pnpm version (needed for module resolution)
RUN corepack enable && corepack prepare pnpm@10.26.0 --activate

# Set working directory
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app ./

# Set NODE_ENV
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["pnpm", "--filter", "@app/api", "start"]
