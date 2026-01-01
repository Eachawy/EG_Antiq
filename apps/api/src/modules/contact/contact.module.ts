import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  imports: [PortalAuthModule],
  controllers: [ContactController],
  providers: [ContactService, PrismaService],
  exports: [ContactService],
})
export class ContactModule {}
