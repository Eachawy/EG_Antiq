import { Module } from '@nestjs/common';
import { PortalSettingsController } from './portal-settings.controller';
import { PortalSettingsService } from './portal-settings.service';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [PortalAuthModule],
  controllers: [PortalSettingsController],
  providers: [PortalSettingsService, PrismaService],
  exports: [PortalSettingsService],
})
export class PortalSettingsModule {}
