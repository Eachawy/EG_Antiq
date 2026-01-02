import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';

// Middleware
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { MonumentsModule } from './modules/monuments/monuments.module';
import { ErasModule } from './modules/eras/eras.module';
import { DynastiesModule } from './modules/dynasties/dynasties.module';
import { MonumentTypesModule } from './modules/monument-types/monument-types.module';
import { DescriptionMonumentsModule } from './modules/description-monuments/description-monuments.module';
import { MonumentsEraModule } from './modules/monuments-era/monuments-era.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { UploadModule } from './modules/upload/upload.module';
import { SourcesModule } from './modules/sources/sources.module';
import { BooksModule } from './modules/books/books.module';
import { MonumentSourcesModule } from './modules/monument-sources/monument-sources.module';
import { MonumentBooksModule } from './modules/monument-books/monument-books.module';

// Portal modules
import { PortalAuthModule } from './modules/portal-auth/portal-auth.module';
import { PortalUsersModule } from './modules/portal-users/portal-users.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { BrowsingHistoryModule } from './modules/browsing-history/browsing-history.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { PortalSettingsModule } from './modules/portal-settings/portal-settings.module';
import { ContactModule } from './modules/contact/contact.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { PortalMonumentsModule } from './modules/portal-monuments/portal-monuments.module';
import { AdminPortalModule } from './modules/admin-portal/admin-portal.module';

// Database
import { PrismaService } from './common/services/prisma.service';
import { EmailService } from './common/services/email.service';

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
    AuthModule,
    RolesModule,
    UsersModule,
    HealthModule,

    // Monument modules
    MonumentsModule,
    ErasModule,
    DynastiesModule,
    MonumentTypesModule,
    DescriptionMonumentsModule,
    MonumentsEraModule,
    GalleryModule,
    UploadModule,
    SourcesModule,
    BooksModule,
    MonumentSourcesModule,
    MonumentBooksModule,

    // Portal modules
    PortalAuthModule,
    PortalUsersModule,
    FavoritesModule,
    BrowsingHistoryModule,
    SavedSearchesModule,
    PortalSettingsModule,
    ContactModule,
    NewsletterModule,
    PortalMonumentsModule,

    // Admin portal management
    AdminPortalModule,
  ],
  providers: [
    PrismaService,
    EmailService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
