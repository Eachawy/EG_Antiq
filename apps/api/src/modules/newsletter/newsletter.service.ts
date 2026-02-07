import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/services/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { AppError } from '../../common/errors/base.error';
import { SubscribeDto } from './dto/subscribe.dto';
import { logger } from '../../logger';
import { config } from '../../config';
import { buildMonumentUrl } from '../../../../../packages/common/src/utils/slug';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
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
      return { subscriptionId: existing.id, alreadySubscribed: true };
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
    this.emailService.sendNewsletterWelcome(email, unsubscribeToken).catch((err) => {
      logger.error('Failed to send welcome email', { email, error: err });
    });

    return { subscriptionId: subscription.id, alreadySubscribed: false };
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

    const data = subscribers.map((sub) => ({
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
   * Fetch latest 4 monuments for newsletter
   */
  private async getLatestMonuments() {
    return this.prisma.monument.findMany({
      take: 4,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        monumentType: true,
        era: true,
        dynasty: true,
      },
    });
  }

  /**
   * Generate HTML for monument card (email-compatible table layout)
   */
  private generateMonumentCardHtml(monument: any, frontendUrl: string, apiUrl: string): string {
    // Truncate name to 40 characters (with null check)
    const rawName = monument.monumentNameEn || monument.monumentNameAr || 'Untitled Monument';
    const nameEn = rawName.length > 30 ? rawName.substring(0, 27) + '...' : rawName;

    // Truncate biography to 130 characters (with null check)
    const rawBio =
      monument.monumentBiographyEn || monument.monumentBiographyAr || 'No description available.';
    const bioEn = rawBio.length > 113 ? rawBio.substring(0, 110) + '...' : rawBio;

    // Construct image URL (with null check)
    // Use a placeholder image service or Kemetra logo as fallback
    const defaultImage = 'https://via.placeholder.com/760x400/c9a961/ffffff?text=Kemetra+Monument';

    let imageUrl: string;
    if (!monument.image) {
      imageUrl = defaultImage;
    } else if (monument.image.startsWith('http')) {
      // Already a full URL
      imageUrl = monument.image;
    } else {
      // Relative path - images are served by API, so use apiUrl
      const imagePath = monument.image.startsWith('/') ? monument.image : '/' + monument.image;
      imageUrl = `${apiUrl}${imagePath}`;
    }

    // Format date
    const dateStr = monument.createdAt
      ? new Date(monument.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
        <tr>
          <td>
            <img src="${imageUrl}" alt="${nameEn}" width="100%" height="200" style="display: block; object-fit: cover;" />
          </td>
        </tr>
        <tr>
          <td style="padding: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 18px; font-weight: 600; line-height: 1.3;">
              ${nameEn}
            </h3>
            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; line-height: 1.5;">
              ${bioEn}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #e5e5e0;padding-top: 12px;">
              <tr>
                <td width="70%" style="color: #999; font-size: 13px;">
                   ${dateStr}
                </td>
                <td width="30%" align="right">
                  <a href="${buildMonumentUrl(monument.id, monument.slugEn || '', 'en', frontendUrl)}" style="color: #c9a961; text-decoration: none; font-size: 14px; font-weight: 500;">
                    Explore →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  }

  /**
   * Convert relative image URLs to absolute URLs in HTML content
   */
  private convertRelativeImagesToAbsolute(htmlContent: string, baseUrl: string): string {
    let result = htmlContent;

    // Replace relative image paths with absolute URLs
    // Matches src="path" or src='path' where path doesn't start with http:// or https://
    result = result.replace(/src=["'](?!https?:\/\/)([^"']+)["']/gi, (_match, imagePath) => {
      // Clean up the path
      const cleanPath = imagePath.trim().replace(/^\.\//, '').replace(/^\//, '');
      // Construct absolute URL
      const absoluteUrl = `${baseUrl}/${cleanPath}`;
      return `src="${absoluteUrl}"`;
    });

    return result;
  }

  /**
   * Replace monument cards placeholder with dynamic content
   */
  private async replaceDynamicMonumentCards(htmlContent: string, frontendUrl: string, apiUrl: string): Promise<string> {
    // Fetch latest monuments
    const monuments = await this.getLatestMonuments();

    // If no monuments available, return a placeholder message
    if (monuments.length === 0) {
      const noMonumentsMessage = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p style="font-size: 16px;">No monuments available at this time.</p>
          <p style="font-size: 14px;">Check back soon for exciting new discoveries!</p>
        </div>
      `;

      let result = htmlContent;
      result = result.replace(/<!--\s*MONUMENT-CARDS\s*-->/gi, noMonumentsMessage);
      result = result.replace(/\{\{\s*monument-cards\s*\}\}/gi, noMonumentsMessage);
      result = result.replace(/\{\{\s*latest_monuments\s*\}\}/gi, noMonumentsMessage);
      result = result.replace(
        /<!--\s*START-MONUMENTS\s*-->[\s\S]*?<!--\s*END-MONUMENTS\s*-->/gi,
        `<!-- START-MONUMENTS -->\n${noMonumentsMessage}\n<!-- END-MONUMENTS -->`
      );
      return result;
    }

    // Generate monument cards in a 2-column grid layout (email-compatible)
    const monumentCardsRows: string[] = [];

    for (let i = 0; i < monuments.length; i += 2) {
      const leftCard = this.generateMonumentCardHtml(monuments[i], frontendUrl, apiUrl);
      const rightCard = monuments[i + 1]
        ? this.generateMonumentCardHtml(monuments[i + 1], frontendUrl, apiUrl)
        : '<td width="48%"></td>'; // Empty cell if odd number

      const row = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
          <tr>
            <td width="48%" style="vertical-align: top;">
              ${leftCard}
            </td>
            <td width="4%"></td>
            <td width="48%" style="vertical-align: top;">
              ${rightCard}
            </td>
          </tr>
        </table>`;

      monumentCardsRows.push(row);
    }

    const monumentCardsHtml = monumentCardsRows.join('\n');

    // Replace placeholder with actual monument cards
    let result = htmlContent;

    // Format 1: HTML comment <!-- MONUMENT-CARDS -->
    result = result.replace(/<!--\s*MONUMENT-CARDS\s*-->/gi, monumentCardsHtml);

    // Format 2: Template variable {{monument-cards}}
    result = result.replace(/\{\{\s*monument-cards\s*\}\}/gi, monumentCardsHtml);
    result = result.replace(/\{\{\s*latest_monuments\s*\}\}/gi, monumentCardsHtml);

    // Format 3: Replace content between start and end markers
    result = result.replace(
      /<!--\s*START-MONUMENTS\s*-->[\s\S]*?<!--\s*END-MONUMENTS\s*-->/gi,
      `<!-- START-MONUMENTS -->\n${monumentCardsHtml}\n<!-- END-MONUMENTS -->`
    );

    return result;
  }

  /**
   * Load the fixed newsletter template
   */
  private loadNewsletterTemplate(): string {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'templates',
      'newsletter-template.html'
    );

    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      logger.error('Failed to load newsletter template', { error });
      throw new AppError('TEMPLATE_NOT_FOUND', 'Newsletter template not found', 500);
    }
  }

  /**
   * Send newsletter with fixed template (simplified admin workflow)
   */
  async sendNewsletterWithTemplate(adminUserId: string) {
    // Load the fixed template
    let template = this.loadNewsletterTemplate();

    // Get current date for subject and template
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const currentYear = new Date().getFullYear().toString();
    const subject = `Kemetra Newsletter - ${currentDate}`;
    const content = 'Explore our latest archaeological discoveries';

    // Replace date and year placeholders in template
    template = template.replace(/\{\{newsletter_date\}\}/gi, currentDate);
    template = template.replace(/\{\{current_year\}\}/gi, currentYear);

    // Use the existing sendNewsletter method with the template
    return this.sendNewsletter(
      {
        subject,
        content,
        htmlContent: template,
      },
      adminUserId
    );
  }

  /**
   * Send newsletter campaign to all subscribers (admin)
   */
  async sendNewsletter(
    campaign: { subject: string; content: string; htmlContent: string },
    adminUserId: string
  ) {
    // Process HTML content
    // Use FRONTEND_URL for monument detail page links
    const frontendUrl = config.FRONTEND_URL || 'https://kemetra.org';
    // Use API_URL for serving images (since images are served by API at /uploads/)
    const apiUrl = config.API_URL || 'http://localhost:3000';

    // Step 1: Convert relative image paths to absolute URLs (using API URL for images)
    let processedHtmlContent = this.convertRelativeImagesToAbsolute(campaign.htmlContent, apiUrl);

    // Step 2: Replace dynamic monument cards
    processedHtmlContent = await this.replaceDynamicMonumentCards(processedHtmlContent, frontendUrl, apiUrl);

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

    // Create campaign record with processed HTML
    const newsletterCampaign = await this.prisma.newsletterCampaign.create({
      data: {
        id: crypto.randomUUID(),
        subject: campaign.subject,
        content: campaign.content,
        htmlContent: processedHtmlContent,
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
            htmlContent: processedHtmlContent,
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

    const successCount = campaign.deliveries.filter((d) => d.deliveryStatus === 'SENT').length;
    const failureCount = campaign.deliveries.filter((d) => d.deliveryStatus === 'FAILED').length;

    return {
      ...campaign,
      stats: {
        total: campaign.deliveries.length,
        successCount,
        failureCount,
        successRate:
          campaign.deliveries.length > 0 ? (successCount / campaign.deliveries.length) * 100 : 0,
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
    const rows = data.map((row) => headers.map((h) => row[h]));

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
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
