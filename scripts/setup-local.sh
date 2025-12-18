#!/bin/bash

set -e

echo "🚀 Setting up local development environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start infrastructure
echo "🐳 Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U postgres &> /dev/null; do
    sleep 1
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker compose exec -T redis redis-cli ping &> /dev/null; do
    sleep 1
done

echo "✅ Infrastructure is ready"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma:generate

# Run migrations
echo "🗄️  Running database migrations..."
pnpm prisma:migrate:deploy

# Seed database
echo "🌱 Seeding database..."
pnpm prisma:seed

echo ""
echo "✅ Setup complete! 🎉"
echo ""
echo "📝 Next steps:"
echo "   1. Review and update .env file if needed"
echo "   2. Start the development server:"
echo "      pnpm dev"
echo ""
echo "   3. Test the API:"
echo "      curl http://localhost:3000/api/v1/health"
echo ""
echo "   4. Login with default admin account:"
echo "      Email: admin@example.com"
echo "      Password: Admin123!"
echo ""
echo "   5. Open Prisma Studio (optional):"
echo "      pnpm prisma:studio"
echo ""
