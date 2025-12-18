# Getting Started Guide

This guide will help you set up and run the production-ready Node.js backend application.

## 14. Getting Started Commands

### Prerequisites Installation

#### 1. Install Node.js 20+
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installation
node --version  # Should be v20.x.x
```

#### 2. Install pnpm
```bash
npm install -g pnpm

# Verify installation
pnpm --version  # Should be 8.x.x or higher
```

#### 3. Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Follow installation instructions for your OS
- Verify: `docker --version`

### Quick Setup (Automated)

Run the automated setup script:

```bash
# Make script executable (if not already)
chmod +x scripts/setup-local.sh

# Run setup
./scripts/setup-local.sh
```

This will:
- ✅ Check prerequisites
- ✅ Copy .env.example to .env
- ✅ Install dependencies
- ✅ Start PostgreSQL and Redis
- ✅ Generate Prisma client
- ✅ Run database migrations
- ✅ Seed initial data

### Manual Setup (Step-by-Step)

If you prefer manual setup or the script fails:

#### Step 1: Clone and Install

```bash
# Navigate to project directory
cd /Volumes/Data/POC/node_app

# Install dependencies
pnpm install
```

#### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# Minimum required changes:
# - JWT_SECRET: Generate a secure random string (min 32 chars)
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 3: Start Infrastructure

```bash
# Start PostgreSQL and Redis using Docker Compose
docker compose up -d postgres redis

# Verify services are running
docker compose ps

# Check PostgreSQL is ready
docker compose exec postgres pg_isready -U postgres

# Check Redis is ready
docker compose exec redis redis-cli ping
```

#### Step 4: Set Up Database

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations (creates tables)
pnpm prisma:migrate:deploy

# Seed database with initial data
pnpm prisma:seed
```

After seeding, you'll have:
- **Organization**: default-org
- **Admin User**: admin@example.com / Admin123!
- **Roles**: ADMIN, MEMBER
- **Permissions**: Full RBAC setup

#### Step 5: Start Development Server

```bash
# Start API server in watch mode
pnpm dev
```

The server will start on `http://localhost:3000`

### Verify Installation

#### 1. Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "timestamp": "2025-12-17T10:30:00.000Z"
  }
}
```

#### 2. Readiness Check

```bash
curl http://localhost:3000/api/v1/health/ready
```

Expected response (database connected):
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  }
}
```

#### 3. Login Test

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

Expected response:
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-here",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "organizationId": "uuid-here"
    }
  }
}
```

#### 4. Authenticated Request Test

```bash
# Save your access token
TOKEN="your-access-token-here"

# Get current user
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Development Workflow

#### Start Development

```bash
# Terminal 1: Start API server
pnpm dev

# Terminal 2: Start worker (optional, for background jobs)
pnpm dev:worker

# Terminal 3: Open Prisma Studio (database GUI)
pnpm prisma:studio
```

#### Making Database Changes

```bash
# 1. Edit schema in packages/database/prisma/schema.prisma

# 2. Create migration
pnpm prisma:migrate:dev --name your_migration_name

# 3. Prisma will automatically:
#    - Generate new migration file
#    - Apply migration to database
#    - Regenerate Prisma client
```

#### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e
```

#### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Both lint and format
pnpm lint && pnpm format
```

### Common Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm lint` | Lint TypeScript code |
| `pnpm format` | Format code with Prettier |
| `pnpm prisma:studio` | Open Prisma Studio |
| `pnpm prisma:migrate:dev` | Create and apply migration |
| `pnpm docker:up` | Start all Docker services |
| `pnpm docker:down` | Stop all Docker services |

### Troubleshooting

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

#### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Reset database (⚠️ destroys all data)
docker compose down -v
docker compose up -d postgres
pnpm prisma:migrate:deploy
pnpm prisma:seed
```

#### Redis Connection Issues

```bash
# Check if Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping

# Restart Redis
docker compose restart redis
```

#### Prisma Client Issues

```bash
# Regenerate Prisma client
pnpm prisma:generate

# If issues persist, clear node_modules
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
pnpm prisma:generate
```

#### Docker Issues

```bash
# Remove all containers and volumes
docker compose down -v

# Remove all images
docker compose down --rmi all

# Start fresh
docker compose up -d
```

### Next Steps

1. **Explore the API**: Use Postman or curl to test endpoints
2. **Review Architecture**: Read `docs/architecture/decisions.md`
3. **Customize**: Modify modules to fit your requirements
4. **Add Features**: Create new modules following existing patterns
5. **Deploy**: Follow deployment guide in README.md

### Development Tips

- **Hot Reload**: The dev server automatically reloads on file changes
- **Database GUI**: Use Prisma Studio to visually inspect/edit data
- **Logs**: Check terminal for structured logs
- **Debug**: Use VS Code debugger with provided configuration
- **Testing**: Write tests alongside features (TDD recommended)

### Need Help?

- Review the main README.md for detailed documentation
- Check docs/ folder for architecture guides
- Open an issue on GitHub for bugs/questions

Happy coding! 🚀
