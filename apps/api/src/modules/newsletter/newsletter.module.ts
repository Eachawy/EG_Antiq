import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { AdminNewsletterController } from './admin-newsletter.controller';
import { NewsletterService } from './newsletter.service';
import { PortalAuthModule } from '../portal-auth/portal-auth.module';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [PortalAuthModule],
  controllers: [NewsletterController, AdminNewsletterController],
  providers: [NewsletterService, PrismaService, EmailService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
