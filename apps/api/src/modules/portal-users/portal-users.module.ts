import { Module } from '@nestjs/common';
import { PortalUsersController } from './portal-users.controller';
import { PortalUsersService } from './portal-users.service';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [PortalAuthModule],
  controllers: [PortalUsersController],
  providers: [PortalUsersService, PrismaService],
  exports: [PortalUsersService],
})
export class PortalUsersModule {}
