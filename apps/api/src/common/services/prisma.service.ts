import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Log warnings
    this.$on('warn' as never, (e: any) => {
      logger.warn('Prisma warning', { message: e.message });
    });

    // Log errors
    this.$on('error' as never, (e: any) => {
      logger.error('Prisma error', { message: e.message });
    });
  }

  async onModuleInit() {
    await this.$connect();
    logger.info('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    logger.info('Database disconnected');
  }

  /**
   * Clean database (for testing)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && key[0] !== '_');

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof typeof this];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany();
        }
      })
    );
  }
}
