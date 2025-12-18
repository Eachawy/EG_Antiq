# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
pnpm dev                    # Start API with hot reload (port 3000)
pnpm dev:worker             # Start background worker
```

### Database Operations
```bash
pnpm prisma:generate        # Generate Prisma client (run after schema changes)
pnpm prisma:migrate:dev     # Create and apply migration (prompts for name)
pnpm prisma:migrate:deploy  # Apply migrations (production, no prompts)
pnpm prisma:studio          # Open Prisma Studio GUI
pnpm prisma:seed            # Seed database with default data
```

### Testing
```bash
pnpm test                   # Run unit tests
pnpm test:integration       # Run integration tests
pnpm test:e2e              # Run E2E tests (requires running server)
pnpm test:cov              # Run tests with coverage report
```

### Build and Quality
```bash
pnpm build                  # Build all packages and apps
pnpm lint                   # Lint and auto-fix TypeScript files
pnpm format                 # Format code with Prettier
```

### Docker
```bash
docker compose up -d postgres redis  # Start infrastructure only
pnpm docker:up              # Start all services including API
pnpm docker:down            # Stop all services
```

## Architecture Overview

### Monorepo Structure
This is a pnpm workspace monorepo with:
- **apps/api** - Main NestJS application
- **packages/common** - Shared utilities, error classes, types, constants
- **packages/database** - Prisma schema, migrations, and seed data
- **packages/logger** - Winston logger configuration

### NestJS Module Organization
The API follows a layered architecture with feature modules:

**apps/api/src/modules/** contains domain modules:
- **auth/** - JWT authentication, login/logout, token refresh
- **users/** - User management and profile endpoints
- **organizations/** - Multi-tenant organization handling
- **health/** - Kubernetes-ready health check endpoints

**apps/api/src/common/** contains cross-cutting concerns:
- **decorators/** - Custom decorators (e.g., @CurrentUser)
- **filters/** - Global exception filter for error handling
- **middleware/** - Correlation ID middleware for request tracing
- **services/** - PrismaService (global database client)

### Database Architecture

**Multi-tenancy Pattern**: Uses shared database with organization-based tenant isolation. Every tenant-scoped query must filter by `organizationId` or `tenant_id`.

**Key Tables**:
- `users` - Authentication and user profiles
- `organizations` - Tenant containers
- `roles`, `permissions`, `user_roles`, `role_permissions` - RBAC system
- `refresh_tokens` - Database-backed JWT refresh tokens
- `audit_logs` - Audit trail for compliance

**Schema Patterns**:
- UUID primary keys (not auto-increment integers)
- Soft deletes via `deleted_at` timestamp
- Optimistic locking via `version` field (increment on update)
- Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
- JSONB fields for flexible metadata (e.g., user `settings`)

### Authentication Flow

1. **Login**: `POST /api/v1/auth/login` validates credentials, returns access token (15min TTL) + refresh token (7d TTL)
2. **Refresh**: `POST /api/v1/auth/refresh` validates refresh token, issues new access token
3. **Logout**: `POST /api/v1/auth/logout` revokes refresh token in database
4. **Protected Routes**: Use `@UseGuards(JwtAuthGuard)` decorator, extract user with `@CurrentUser()` decorator

Default credentials after seed: `admin@example.com` / `Admin123!`

### Request Lifecycle

1. **Correlation ID Middleware** - Generates or extracts X-Correlation-ID header, stores in AsyncLocalStorage
2. **Rate Limiting** - ThrottlerGuard enforces 100 requests/minute globally
3. **Validation Pipe** - Validates DTOs using class-validator decorators (auto-enabled globally)
4. **Route Handler** - Controller → Service → PrismaService → Database
5. **Exception Filter** - Catches all errors, logs with correlation ID, returns structured error response

### Error Handling Pattern

Custom error classes in `packages/common/src/errors/`:
- `ValidationError` → HTTP 400
- `UnauthorizedError` → HTTP 401
- `ForbiddenError` → HTTP 403
- `NotFoundError` → HTTP 404
- `ConflictError` → HTTP 409

Global exception filter (`apps/api/src/common/filters/all-exceptions.filter.ts`) catches all errors and returns:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "correlationId": "uuid-v4"
  }
}
```

### Logging Strategy

Uses Winston structured logging (`packages/logger`):
- **Development**: Pretty console logs with colors
- **Production**: JSON logs for log aggregation tools
- Every log includes correlation ID from AsyncLocalStorage
- Log levels: error, warn, info, debug

## Important Conventions

### Adding a New Feature Module

1. Create module directory in `apps/api/src/modules/your-module/`
2. Create files: `your-module.module.ts`, `your-module.controller.ts`, `your-module.service.ts`
3. Define DTOs in `dto/` subdirectory with class-validator decorators
4. Import module in `app.module.ts`
5. Add database schema changes to `packages/database/prisma/schema.prisma`
6. Run `pnpm prisma:migrate:dev --name add_your_feature`

### Working with Prisma

**After schema changes**:
```bash
pnpm prisma:generate  # Regenerates TypeScript client
pnpm prisma:migrate:dev --name descriptive_migration_name
```

**Querying with tenant isolation**:
```typescript
await prisma.user.findMany({
  where: {
    organizationId: currentUser.organizationId,  // Always filter by tenant
    deletedAt: null,  // Soft delete filter
  },
});
```

**Transaction pattern**:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.user.update(...);
  await tx.auditLog.create(...);
});
```

### Testing Multi-Tenant Features

Always test with multiple organizations to ensure proper tenant isolation:
1. Create test organizations in seed or test setup
2. Verify queries cannot access other tenants' data
3. Test with different user roles in different organizations

### Configuration Management

Environment variables are validated on startup using Zod schema in `apps/api/src/config/index.ts`. Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Must be 32+ characters

Add new config by:
1. Add to `.env.example`
2. Add validation to `apps/api/src/config/index.ts`
3. Access via `ConfigService` dependency injection

### Creating Database Migrations

For schema changes:
```bash
# Edit packages/database/prisma/schema.prisma
pnpm prisma:migrate:dev --name your_descriptive_name
```

For data migrations, create a migration and add data operations in the migration SQL file.

## Quick Reference

### Default Ports
- API: 3000
- PostgreSQL: 5432
- Redis: 6379
- Prisma Studio: 5555

### API Base Path
All endpoints are prefixed with `/api/v1`

### Health Checks
- `GET /api/v1/health` - Liveness (always returns 200)
- `GET /api/v1/health/ready` - Readiness (checks database connection)
