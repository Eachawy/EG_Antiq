import { Module } from '@nestjs/common';
import { AdminPortalController } from './admin-portal.controller';
import { AdminPortalService } from './admin-portal.service';
import { PrismaService } from '../../common/services/prisma.service';

// Import existing portal modules to reuse services
import { FavoritesModule } from '../favorites/favorites.module';
import { BrowsingHistoryModule } from '../browsing-history/browsing-history.module';
import { SavedSearchesModule } from '../saved-searches/saved-searches.module';
import { PortalSettingsModule } from '../portal-settings/portal-settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    FavoritesModule,
    BrowsingHistoryModule,
    SavedSearchesModule,
    PortalSettingsModule,
  ],
  controllers: [AdminPortalController],
  providers: [AdminPortalService, PrismaService],
  exports: [AdminPortalService],
})
export class AdminPortalModule {}
