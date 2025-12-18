import { PrismaClient } from '@prisma/client';
import { logger } from '@packages/logger';

// Export PrismaClient explicitly
export { PrismaClient } from '@prisma/client';

// Create Prisma client instance
export const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' },
  ],
});

// Log warnings
prisma.$on('warn', (e: any) => {
  logger.warn('Prisma warning', { message: e.message });
});

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Prisma error', { message: e.message });
});

// Log slow queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    if (e.duration > 1000) {
      // Log queries taking longer than 1 second
      logger.warn('Slow query detected', {
        query: e.query,
        duration: e.duration,
        params: e.params,
      });
    }
  });
}

// Graceful shutdown
async function disconnectPrisma() {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
}

process.on('beforeExit', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);

// Export Prisma types
export * from '@prisma/client';
