# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy package files
COPY apps/api/package.json ./

# Install dependencies (no lockfile for simplicity in Docker)
RUN pnpm install

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder

RUN npm install -g pnpm@10

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy source code
COPY apps/api/src ./src
COPY apps/api/prisma ./prisma
COPY apps/api/nest-cli.json ./nest-cli.json

# Copy and modify tsconfig for Docker build (output to ./dist instead of ../../dist)
COPY apps/api/tsconfig.json ./tsconfig.json
RUN sed -i 's|"outDir": "../../dist"|"outDir": "./dist"|g' tsconfig.json

# Generate Prisma client
RUN pnpm prisma generate

# Build application
RUN pnpm build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-slim AS production

# Install dumb-init and OpenSSL for proper signal handling and Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

WORKDIR /app

# Copy production dependencies (including generated Prisma client from builder)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy prisma schema for runtime access
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Note: .env files should be provided via environment variables in production

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application (runs migrations first, then starts server)
WORKDIR /app
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
