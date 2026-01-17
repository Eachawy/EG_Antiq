import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { logger } from '../../logger';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Submit a contact message (public endpoint)
   */
  async submitMessage(
    createDto: CreateContactMessageDto,
    portalUserId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const contactMessage = await this.prisma.contactMessage.create({
      data: {
        id: crypto.randomUUID(),
        portalUserId: portalUserId || null,
        name: createDto.name,
        email: createDto.email,
        message: createDto.message,
        ipAddress,
        userAgent,
        status: 'PENDING',
      },
    });

    logger.info('Contact message submitted', {
      messageId: contactMessage.id,
      email: createDto.email,
      portalUserId,
    });

    // Send email notification to admin
    await this.emailService.sendContactNotification({
      messageId: contactMessage.id,
      senderName: contactMessage.name,
      senderEmail: contactMessage.email,
      message: contactMessage.message,
      ipAddress: contactMessage.ipAddress || undefined,
      userAgent: contactMessage.userAgent || undefined,
      createdAt: contactMessage.createdAt,
    });

    return contactMessage;
  }

  /**
   * Get user's own contact messages (authenticated)
   */
  async getMyMessages(portalUserId: string) {
    const messages = await this.prisma.contactMessage.findMany({
      where: { portalUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        status: true,
        respondedAt: true,
        response: true,
        createdAt: true,
      },
    });

    return messages;
  }
}
