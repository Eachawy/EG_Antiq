# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
pnpm dev                    # Start API with hot reload (port 3000)
```

### Database Operations
```bash
pnpm prisma:generate        # Generate Prisma client (run after schema changes)
pnpm prisma:migrate:dev     # Create and apply migration (prompts for name)
pnpm prisma:migrate:deploy  # Apply migrations (production, no prompts)
pnpm prisma:studio          # Open Prisma Studio GUI
pnpm prisma:seed            # Seed database with default data
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

**apps/api/src/modules/** contains domain modules organized into two main areas:

**Admin/Organization Domain** (for staff managing the system):
- **auth/** - Admin JWT authentication for organization users
- **users/** - User management (admin)
- **roles/** - RBAC for admin users
- **monuments/** - Monument data management (admin)
- **eras/**, **dynasties/**, **monument-types/** - Reference data management
- **gallery/**, **description-monuments/**, **monuments-era/** - Monument metadata
- **sources/** - Academic and historical sources management
- **books/** - Books and publications management
- **monument-sources/**, **monument-books/** - Monument-source and monument-book relationships
- **upload/** - File upload handling
- **admin-portal/** - Admin portal management features

**Portal Domain** (for public users browsing monuments):
- **portal-auth/** - Portal user authentication (email/password + OAuth: Google, Facebook, Apple)
- **portal-users/** - Portal user profile management
- **portal-monuments/** - Public monument search and browsing
- **favorites/** - User favorites tracking
- **browsing-history/** - User browsing history
- **saved-searches/** - User saved search queries
- **portal-settings/** - User preferences and settings
- **contact/** - Contact form submissions
- **newsletter/** - Newsletter subscription management

**Cross-cutting modules**:
- **health/** - Kubernetes-ready health check endpoints

**apps/api/src/common/** contains shared concerns:
- **decorators/** - Custom decorators (e.g., @CurrentUser for admin users)
- **filters/** - Global exception filter for error handling
- **middleware/** - Correlation ID middleware for request tracing
- **services/** - PrismaService (global database client), EmailService

Note: Portal-specific decorators like @CurrentPortalUser are in `apps/api/src/modules/portal-auth/decorators/`

### Dual Authentication System

This application has **two separate JWT authentication systems**:

1. **Admin Auth** (`/api/v1/auth/*`):
   - For organization users (staff managing the system)
   - Uses `JWT_SECRET` environment variable
   - Multi-tenant with organization-based isolation
   - RBAC with roles and permissions
   - User model: `User` with `organizationId`

2. **Portal Auth** (`/api/v1/portal/auth/*`):
   - For public users browsing monuments
   - Uses `PORTAL_JWT_SECRET` environment variable
   - Supports email/password and OAuth (Google, Facebook, Apple)
   - User model: `PortalUser` with optional password (OAuth-only users have null password)
   - Features: favorites, browsing history, saved searches, settings

**IMPORTANT**: When working with authentication:
- Use correct JWT secret (`JWT_SECRET` vs `PORTAL_JWT_SECRET`)
- Use correct user model (`User` vs `PortalUser`)
- Use correct guards (`JwtAuthGuard` vs `PortalJwtAuthGuard`)
- Use correct decorators (`@CurrentUser` vs `@CurrentPortalUser`)
- Use `@Public()` decorator from `apps/api/src/modules/auth/decorators/public.decorator.ts` to bypass JWT guard for public routes

### Database Architecture

**Dual User System**: The database schema supports two distinct user types:
- `users` table - Organization/admin users with multi-tenancy via `organizationId`
- `portal_users` table - Public portal users with OAuth support

**Multi-tenancy Pattern** (Admin domain only): Uses shared database with organization-based tenant isolation. Every tenant-scoped query for admin users must filter by `organizationId`.

**Key Admin Tables**:
- `users` - Admin authentication and user profiles
- `organizations` - Tenant containers
- `roles`, `permissions`, `user_roles`, `role_permissions` - RBAC system
- `refresh_tokens` - JWT refresh tokens for admin users
- `audit_logs` - Audit trail for compliance
- `sessions` - User session management

**Key Portal Tables**:
- `portal_users` - Portal user accounts
- `oauth_providers` - OAuth provider connections (Google, Facebook, Apple)
- `portal_refresh_tokens` - JWT refresh tokens for portal users
- `favorites` - User favorite monuments
- `browsing_history` - User monument browsing history
- `saved_searches` - User saved search queries
- `user_settings` - User preferences and settings
- `contact_messages` - Contact form submissions
- `newsletter_subscriptions` - Newsletter subscriptions

**Monument Tables**:
- `eras`, `dynasty`, `monuments_type` - Reference data
- `monuments` - Main monument data
- `gallery` - Monument images
- `description_monuments` - Monument descriptions
- `monuments_era` - Monument-era relationships

**Sources and Books Tables**:
- `sources` - Academic and historical sources (journals, books, websites, etc.)
- `books` - Books and publications about monuments
- `monument_sources` - Links monuments to their sources
- `monument_books` - Links monuments to related books

**Schema Patterns**:
- UUID primary keys for users/auth tables, auto-increment integers for monument tables
- Soft deletes via `deletedAt` timestamp
- Optimistic locking via `version` field (increment on update) for critical tables
- Audit fields: `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- JSONB fields for flexible metadata (e.g., organization `settings`, user `additionalSettings`)

### Authentication Flows

**Admin Login**: `POST /api/v1/auth/login` validates credentials, returns access token (15min TTL) + refresh token (7d TTL), includes user roles in JWT.

**Portal Login**:
- Email/Password: `POST /api/v1/portal/auth/login`
- OAuth: `POST /api/v1/portal/auth/google`, `/facebook`, `/apple`
- Returns access token + refresh token
- OAuth creates new user or links provider to existing user

**Protected Routes**:
- Admin: Use `@UseGuards(JwtAuthGuard)`, extract user with `@CurrentUser()`
- Portal: Use `@UseGuards(PortalJwtAuthGuard)`, extract user with `@CurrentPortalUser()`

Default admin credentials after seed: `admin@example.com` / `Admin123!`

**RBAC (Role-Based Access Control)** - Admin domain only:
- Use `@Roles('ADMIN', 'MEMBER')` decorator to restrict routes by role
- Use `@RequirePermissions({ resource: 'users', action: 'create' })` for fine-grained permission control
- Apply `RolesGuard` or `PermissionsGuard` along with `JwtAuthGuard`
- User roles are included in JWT payload and available via `@CurrentUser()`

### Request Lifecycle

1. **Correlation ID Middleware** - Generates or extracts X-Correlation-ID header, stores in AsyncLocalStorage
2. **Rate Limiting** - ThrottlerGuard enforces 100 requests/minute globally
3. **Validation Pipe** - Validates DTOs using class-validator decorators (auto-enabled globally)
4. **Route Handler** - Controller → Service → PrismaService → Database
5. **Exception Filter** - Catches all errors, logs with correlation ID, returns structured error response

### Error Handling Pattern

Custom error classes in `packages/common/src/errors/base.error.ts`:
- `AppError(code, message, statusCode)` - Generic error with custom code
- `ValidationError` - 400 Bad Request
- `UnauthorizedError` - 401 Unauthorized
- `ForbiddenError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `ConflictError` - 409 Conflict
- `BusinessError` - 422 Unprocessable Entity
- `InternalError` - 500 Internal Server Error
- `ServiceUnavailableError` - 503 Service Unavailable

Global exception filter (`apps/api/src/common/filters/all-exceptions.filter.ts`) catches all errors and returns:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "correlationId": "uuid-v4",
    "path": "/api/v1/path"
  }
}
```

### Logging Strategy

Uses Winston structured logging (`packages/logger`):
- **Development**: Pretty console logs with colors
- **Production**: JSON logs for log aggregation tools
- Every log includes correlation ID from AsyncLocalStorage
- Import logger: `import { logger } from '../../logger'`
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

**Querying with tenant isolation** (Admin domain only):
```typescript
await prisma.user.findMany({
  where: {
    organizationId: currentUser.organizationId,  // Always filter by tenant
    deletedAt: null,  // Soft delete filter
  },
});
```

**Portal queries** (no tenant isolation):
```typescript
await prisma.portalUser.findUnique({
  where: { id: portalUserId },
  include: {
    favorites: true,
    settings: true,
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

### OAuth Integration

The portal supports Google, Facebook, and Apple OAuth. OAuth flow:
1. Frontend redirects to OAuth provider
2. Provider redirects back with code/token
3. Backend validates and creates/updates `OAuthProvider` record
4. Links to existing `PortalUser` by email or creates new user
5. Returns JWT access/refresh tokens

OAuth users may not have passwords (`passwordHash` is nullable in `portal_users`).

### Configuration Management

Environment variables are validated on startup using Zod schema in `apps/api/src/config/index.ts`. Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Admin JWT secret (32+ characters)
- `PORTAL_JWT_SECRET` - Portal JWT secret (32+ characters)
- `API_URL` - Base API URL (required for OAuth callbacks)
- OAuth credentials for Google, Facebook, Apple (if using OAuth)
- Email service credentials

Add new config by:
1. Add to `.env.example`
2. Add validation to `apps/api/src/config/index.ts`
3. Access via `config` import (not `ConfigService`)

### Creating Database Migrations

For schema changes:
```bash
# Edit packages/database/prisma/schema.prisma
pnpm prisma:migrate:dev --name your_descriptive_name
```

For data migrations, create a migration and add data operations in the migration SQL file.

### File Upload Handling

The API serves uploaded files statically from `/uploads/` path:
- **Development**: Files stored in `apps/api/uploads/`
- **Production (Docker)**: Files stored in `/app/uploads/`
- Use the `upload/` module for file upload endpoints
- Images are served with CORS enabled for cross-origin access

## Quick Reference

### Default Ports
- API: 3000
- PostgreSQL: 5433 (note: non-standard port)
- Redis: 6379
- Prisma Studio: 5555

### API Base Path
All endpoints are prefixed with `/api/v1`

### API Documentation
Swagger UI available at `/api/docs` when running locally

### Health Checks
- `GET /api/v1/health` - Liveness (always returns 200)
- `GET /api/v1/health/ready` - Readiness (checks database connection)

### Database Connection
PostgreSQL runs on port 5433 (non-standard) with credentials:
- User: `postgres`
- Password: `Antiq_dev`
- Database: `Antiq_db`
- Connection string: `postgresql://postgres:Antiq_dev@localhost:5433/Antiq_db`
