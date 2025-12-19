import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';

// Middleware
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

// Modules
import { HealthModule } from './modules/health/health.module';
import { MonumentsModule } from './modules/monuments/monuments.module';
import { ErasModule } from './modules/eras/eras.module';
import { DynastiesModule } from './modules/dynasties/dynasties.module';
import { MonumentTypesModule } from './modules/monument-types/monument-types.module';
import { DescriptionMonumentsModule } from './modules/description-monuments/description-monuments.module';
import { MonumentsEraModule } from './modules/monuments-era/monuments-era.module';
import { GalleryModule } from './modules/gallery/gallery.module';

// Database
import { PrismaService } from './common/services/prisma.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Health checks
    TerminusModule,

    // Feature modules
    HealthModule,

    // Monument modules
    MonumentsModule,
    ErasModule,
    DynastiesModule,
    MonumentTypesModule,
    DescriptionMonumentsModule,
    MonumentsEraModule,
    GalleryModule,
  ],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
