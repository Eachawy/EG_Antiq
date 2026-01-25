import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { AppError } from '../../common/errors/base.error';
import { SubscribeDto } from './dto/subscribe.dto';
import { logger } from '../../logger';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

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

    // Generate unsubscribe token only (no verification needed)
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Create or update subscription - IMMEDIATELY ACTIVE
    const subscription = await this.prisma.newsletterSubscription.upsert({
      where: { email },
      create: {
        id: crypto.randomUUID(),
        portalUserId: portalUserId || null,
        email,
        isSubscribed: true, // Immediate subscription
        verifiedAt: new Date(), // Mark as verified immediately
        verificationToken: null, // No verification needed
        unsubscribeToken,
        subscribedAt: new Date(),
      },
      update: {
        portalUserId: portalUserId || undefined,
        isSubscribed: true, // Immediate subscription
        verifiedAt: new Date(), // Mark as verified immediately
        verificationToken: null, // No verification needed
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    });

    logger.info('Newsletter subscription completed immediately', { email, portalUserId });

    // Send welcome email (non-blocking - don't await)
    this.emailService.sendNewsletterWelcome(email, unsubscribeToken).catch(err => {
      logger.error('Failed to send welcome email', { email, error: err });
    });

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

  /**
   * Get all subscribers with pagination and filtering (admin)
   */
  async getAllSubscribers(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'subscribed' | 'unsubscribed' | 'all';
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status === 'subscribed') {
      where.isSubscribed = true;
    } else if (filters.status === 'unsubscribed') {
      where.isSubscribed = false;
    }

    if (filters.search) {
      where.email = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const [subscribers, total] = await Promise.all([
      this.prisma.newsletterSubscription.findMany({
        where,
        select: {
          id: true,
          email: true,
          isSubscribed: true,
          subscribedAt: true,
          unsubscribedAt: true,
          verifiedAt: true,
          portalUser: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.newsletterSubscription.count({ where }),
    ]);

    return {
      data: subscribers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get newsletter subscription statistics (admin)
   */
  async getStatistics() {
    const [total, subscribed, unsubscribed, thisMonth] = await Promise.all([
      this.prisma.newsletterSubscription.count(),
      this.prisma.newsletterSubscription.count({ where: { isSubscribed: true } }),
      this.prisma.newsletterSubscription.count({ where: { isSubscribed: false } }),
      this.prisma.newsletterSubscription.count({
        where: {
          subscribedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          isSubscribed: true,
        },
      }),
    ]);

    return {
      total,
      subscribed,
      unsubscribed,
      newThisMonth: thisMonth,
    };
  }

  /**
   * Remove subscriber (admin)
   */
  async removeSubscriber(subscriptionId: string, adminUserId: string) {
    const subscription = await this.prisma.newsletterSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new AppError('NOT_FOUND', 'Subscription not found', 404);
    }

    await this.prisma.newsletterSubscription.delete({
      where: { id: subscriptionId },
    });

    logger.info('Subscription removed by admin', {
      subscriptionId,
      email: subscription.email,
      adminUserId,
    });
  }

  /**
   * Export subscribers to CSV or Excel (admin)
   */
  async exportSubscribers(format: 'csv' | 'excel') {
    const subscribers = await this.prisma.newsletterSubscription.findMany({
      where: { isSubscribed: true },
      select: {
        email: true,
        subscribedAt: true,
        portalUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { subscribedAt: 'desc' },
    });

    const data = subscribers.map(sub => ({
      Email: sub.email,
      'First Name': sub.portalUser?.firstName || '',
      'Last Name': sub.portalUser?.lastName || '',
      'Subscribed Date': sub.subscribedAt.toISOString(),
    }));

    if (format === 'csv') {
      return this.generateCsv(data);
    } else {
      return this.generateExcel(data);
    }
  }

  /**
   * Send newsletter campaign to all subscribers (admin)
   */
  async sendNewsletter(
    campaign: { subject: string; content: string; htmlContent: string },
    adminUserId: string,
  ) {
    // Get all active subscribers
    const subscribers = await this.prisma.newsletterSubscription.findMany({
      where: { isSubscribed: true },
      select: {
        id: true,
        email: true,
        unsubscribeToken: true,
      },
    });

    if (subscribers.length === 0) {
      throw new AppError('NO_SUBSCRIBERS', 'No active subscribers found', 400);
    }

    // Create campaign record
    const newsletterCampaign = await this.prisma.newsletterCampaign.create({
      data: {
        id: crypto.randomUUID(),
        subject: campaign.subject,
        content: campaign.content,
        htmlContent: campaign.htmlContent,
        sentBy: adminUserId,
        recipientCount: subscribers.length,
        status: 'SENDING',
      },
    });

    // Send emails in batches of 50
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const deliveryPromises = batch.map(async (subscriber) => {
        try {
          await this.emailService.sendNewsletterCampaign({
            email: subscriber.email,
            subject: campaign.subject,
            content: campaign.content,
            htmlContent: campaign.htmlContent,
            unsubscribeToken: subscriber.unsubscribeToken,
          });

          await this.prisma.newsletterDelivery.create({
            data: {
              id: crypto.randomUUID(),
              campaignId: newsletterCampaign.id,
              subscriberEmail: subscriber.email,
              deliveryStatus: 'SENT',
            },
          });

          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          await this.prisma.newsletterDelivery.create({
            data: {
              id: crypto.randomUUID(),
              campaignId: newsletterCampaign.id,
              subscriberEmail: subscriber.email,
              deliveryStatus: 'FAILED',
              errorMessage,
            },
          });

          failureCount++;
          logger.error('Failed to send newsletter', {
            email: subscriber.email,
            error,
          });
        }
      });

      await Promise.allSettled(deliveryPromises);

      // Delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update campaign status
    await this.prisma.newsletterCampaign.update({
      where: { id: newsletterCampaign.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    logger.info('Newsletter campaign completed', {
      campaignId: newsletterCampaign.id,
      successCount,
      failureCount,
    });

    return {
      campaignId: newsletterCampaign.id,
      recipientCount: subscribers.length,
      successCount,
      failureCount,
    };
  }

  /**
   * Get campaign history with pagination (admin)
   */
  async getCampaignHistory(filters: { page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.newsletterCampaign.findMany({
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              deliveries: true,
            },
          },
        },
      }),
      this.prisma.newsletterCampaign.count(),
    ]);

    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get campaign details with delivery stats (admin)
   */
  async getCampaignDetails(campaignId: string) {
    const campaign = await this.prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
      include: {
        deliveries: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    }

    const successCount = campaign.deliveries.filter(d => d.deliveryStatus === 'SENT').length;
    const failureCount = campaign.deliveries.filter(d => d.deliveryStatus === 'FAILED').length;

    return {
      ...campaign,
      stats: {
        total: campaign.deliveries.length,
        successCount,
        failureCount,
        successRate: campaign.deliveries.length > 0
          ? (successCount / campaign.deliveries.length) * 100
          : 0,
      },
    };
  }

  /**
   * Generate CSV from data
   */
  private generateCsv(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h]));

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Generate Excel from data
   */
  private generateExcel(data: any[]): Buffer {
    // For now, return CSV format as buffer
    // TODO: Implement proper Excel generation using xlsx library
    const csv = this.generateCsv(data);
    return Buffer.from(csv, 'utf-8');
  }
}
