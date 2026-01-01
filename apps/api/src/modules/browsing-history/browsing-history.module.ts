import { Module } from '@nestjs/common';
import { BrowsingHistoryController } from './browsing-history.controller';
import { BrowsingHistoryService } from './browsing-history.service';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [PortalAuthModule],
  controllers: [BrowsingHistoryController],
  providers: [BrowsingHistoryService, PrismaService],
  exports: [BrowsingHistoryService],
})
export class BrowsingHistoryModule {}
