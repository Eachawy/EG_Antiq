import { Module } from '@nestjs/common';
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [PortalAuthModule],
  controllers: [SavedSearchesController],
  providers: [SavedSearchesService, PrismaService],
  exports: [SavedSearchesService],
})
export class SavedSearchesModule {}
