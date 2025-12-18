# Production-Ready Node.js Backend

A complete, production-ready backend application built with NestJS, PostgreSQL, Prisma, and Redis. This application follows enterprise-grade architecture patterns and best practices.

## Features

- **Authentication & Authorization**: JWT-based auth with access/refresh tokens, RBAC
- **Multi-tenancy**: Organization-based data isolation
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for caching and rate limiting
- **Logging**: Structured logging with Winston
- **Health Checks**: Liveness and readiness probes
- **Security**: Helmet, CORS, rate limiting, input validation
- **Testing**: Unit, integration, and E2E tests
- **Docker**: Multi-stage Dockerfile for optimized builds
- **CI/CD**: GitHub Actions workflows
- **Monitoring**: Ready for Prometheus, Grafana, Jaeger integration

## Architecture

```
apps/
├── api/          # Main NestJS API application
└── worker/       # Background job processor (optional)

packages/
├── common/       # Shared utilities, errors, types
├── database/     # Prisma schema and client
├── logger/       # Winston logger configuration
└── queue/        # BullMQ queue setup (optional)
```

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for local development)
- PostgreSQL 15+
- Redis 7+

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure (Docker)

```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis
```

### 4. Run Database Migrations

```bash
pnpm prisma:migrate:dev
```

### 5. Seed Database

```bash
pnpm prisma:seed
```

This creates:
- Default organization: `default-org`
- Admin user: `admin@example.com` / `Admin123!`
- Default roles and permissions

### 6. Start Development Server

```bash
pnpm dev
```

The API will be available at `http://localhost:3000/api/v1`

## Available Scripts

```bash
# Development
pnpm dev                    # Start API in watch mode
pnpm dev:worker             # Start worker in watch mode

# Build
pnpm build                  # Build all packages and applications

# Testing
pnpm test                   # Run unit tests
pnpm test:integration       # Run integration tests
pnpm test:e2e              # Run E2E tests
pnpm test:cov              # Run tests with coverage

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate:dev     # Create and apply migration
pnpm prisma:migrate:deploy  # Apply migrations (production)
pnpm prisma:studio          # Open Prisma Studio
pnpm prisma:seed            # Seed database

# Code Quality
pnpm lint                   # Lint code
pnpm format                 # Format code with Prettier

# Docker
pnpm docker:build           # Build Docker images
pnpm docker:up              # Start all services
pnpm docker:down            # Stop all services
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/login      # Login with email/password
POST   /api/v1/auth/refresh    # Refresh access token
POST   /api/v1/auth/logout     # Logout and revoke refresh token
```

### Users

```
GET    /api/v1/users/me        # Get current user
GET    /api/v1/users/:id       # Get user by ID
GET    /api/v1/users           # List users (paginated)
```

### Health

```
GET    /api/v1/health          # Liveness probe
GET    /api/v1/health/ready    # Readiness probe
```

## Testing

### Login Example

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Response:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "organizationId": "..."
    }
  }
}
```

### Get Current User

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/app_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-min-32-characters-long
```

### Optional Variables

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
CORS_ORIGINS=http://localhost:3000
```

## Production Deployment

### 1. Build Docker Image

```bash
docker build -f docker/api.Dockerfile -t my-api:latest .
```

### 2. Deploy to Kubernetes

```bash
# Update image in k8s/base/api-deployment.yaml
kubectl apply -k k8s/overlays/production
```

### 3. Run Migrations

```bash
kubectl exec -it deployment/api -- pnpm prisma:migrate:deploy
```

## Security Best Practices

✅ Environment variables for secrets
✅ JWT with short-lived access tokens
✅ Refresh token rotation
✅ Password hashing with bcrypt (12 rounds)
✅ Input validation with class-validator
✅ SQL injection prevention (Prisma)
✅ XSS prevention (Helmet)
✅ CORS configuration
✅ Rate limiting
✅ Audit logging
✅ Multi-tenancy with tenant isolation

## Monitoring & Observability

- **Logs**: Structured JSON logs (Winston)
- **Metrics**: Prometheus-compatible `/metrics` endpoint
- **Tracing**: OpenTelemetry integration ready
- **Health Checks**: `/health` and `/health/ready` endpoints
- **Correlation IDs**: Request tracking across services

## Architecture Decisions

See `docs/architecture/decisions.md` for detailed architectural decision records (ADRs).

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
