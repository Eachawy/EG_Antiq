import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { SubscribeDto } from './dto/subscribe.dto';
import { logger } from '../../logger';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Subscribe to newsletter (public endpoint)
   */
  async subscribe(subscribeDto: SubscribeDto, portalUserId?: string) {
    const { email } = subscribeDto;

    // Check if already subscribed
    const existing = await this.prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing && existing.isSubscribed) {
      throw new AppError('ALREADY_SUBSCRIBED', 'This email is already subscribed', 409);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Create or update subscription
    const subscription = await this.prisma.newsletterSubscription.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        portalUserId: portalUserId || null,
        email,
        isSubscribed: false, // Will be true after verification
        verificationToken,
        unsubscribeToken,
        subscribedAt: new Date(),
      },
      update: {
        portalUserId: portalUserId || undefined,
        isSubscribed: false,
        verificationToken,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    });

    logger.info('Newsletter subscription initiated', { email, portalUserId });

    // TODO: Send verification email
    // await this.emailService.sendNewsletterVerification(email, verificationToken);

    return { subscriptionId: subscription.id };
  }

  /**
   * Verify newsletter subscription
   */
  async verify(token: string) {
    const subscription = await this.prisma.newsletterSubscription.findFirst({
      where: { verificationToken: token },
    });

    if (!subscription) {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired verification token', 400);
    }

    if (subscription.isSubscribed) {
      throw new AppError('ALREADY_VERIFIED', 'Email already verified', 400);
    }

    // Mark as subscribed
    await this.prisma.newsletterSubscription.update({
      where: { id: subscription.id },
      data: {
        isSubscribed: true,
        verifiedAt: new Date(),
        verificationToken: null,
      },
    });

    logger.info('Newsletter subscription verified', { email: subscription.email });
  }

  /**
   * Unsubscribe from newsletter
   */
  async unsubscribe(token: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { unsubscribeToken: token },
    });

    if (!subscription) {
      throw new AppError('INVALID_TOKEN', 'Invalid unsubscribe token', 400);
    }

    // Mark as unsubscribed
    await this.prisma.newsletterSubscription.update({
      where: { id: subscription.id },
      data: {
        isSubscribed: false,
        unsubscribedAt: new Date(),
      },
    });

    logger.info('Newsletter subscription cancelled', { email: subscription.email });
  }

  /**
   * Get subscription status (authenticated)
   */
  async getStatus(portalUserId: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { portalUserId },
      select: {
        email: true,
        isSubscribed: true,
        verifiedAt: true,
        subscribedAt: true,
      },
    });

    return subscription;
  }
}
