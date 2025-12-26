import { Module } from '@nestjs/common';
import { PortalMonumentsController } from './portal-monuments.controller';
import { PortalMonumentsService } from './portal-monuments.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [PortalMonumentsController],
  providers: [PortalMonumentsService, PrismaService],
  exports: [PortalMonumentsService],
})
export class PortalMonumentsModule {}
