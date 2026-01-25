import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { NewsletterService } from './newsletter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SendNewsletterDto } from './dto/send-newsletter.dto';
import { SubscriberFiltersDto } from './dto/subscriber-filters.dto';

@ApiTags('Admin - Newsletter Management')
@Controller('admin/newsletter')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get('subscribers')
  @RequirePermissions({ resource: 'newsletter', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get all newsletter subscribers' })
  @ApiResponse({ status: 200, description: 'Subscribers retrieved successfully' })
  async getAllSubscribers(@Query() filters: SubscriberFiltersDto) {
    const result = await this.newsletterService.getAllSubscribers(filters);
    return {
      data: result.data,
      meta: result.meta,
      message: 'Subscribers retrieved successfully',
    };
  }

  @Get('statistics')
  @RequirePermissions({ resource: 'newsletter', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get newsletter statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    const stats = await this.newsletterService.getStatistics();
    return {
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }

  @Delete('subscribers/:id')
  @RequirePermissions({ resource: 'newsletter', action: 'delete' })
  @ApiOperation({ summary: '[Admin] Remove subscriber' })
  @ApiResponse({ status: 200, description: 'Subscriber removed successfully' })
  async removeSubscriber(
    @Param('id') subscriptionId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    await this.newsletterService.removeSubscriber(subscriptionId, admin.id);
    return {
      message: 'Subscriber removed successfully',
    };
  }

  @Get('export')
  @RequirePermissions({ resource: 'newsletter', action: 'read' })
  @ApiOperation({ summary: '[Admin] Export subscribers to CSV/Excel' })
  @ApiResponse({ status: 200, description: 'Subscribers exported successfully' })
  async exportSubscribers(
    @Query('format') format: 'csv' | 'excel',
    @Res() res: Response,
  ) {
    const data = await this.newsletterService.exportSubscribers(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=subscribers.xlsx');
      res.send(data);
    }
  }

  @Post('send')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 per hour
  @RequirePermissions({ resource: 'newsletter', action: 'create' })
  @ApiOperation({ summary: '[Admin] Send newsletter to all subscribers' })
  @ApiResponse({ status: 200, description: 'Newsletter sent successfully' })
  @ApiResponse({ status: 400, description: 'No active subscribers found' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async sendNewsletter(
    @Body() sendNewsletterDto: SendNewsletterDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const result = await this.newsletterService.sendNewsletter(
      sendNewsletterDto,
      admin.id,
    );
    return {
      data: result,
      message: 'Newsletter sent successfully',
    };
  }

  @Get('campaigns')
  @RequirePermissions({ resource: 'newsletter', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get campaign history' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async getCampaignHistory(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.newsletterService.getCampaignHistory({ page, limit });
    return {
      data: result.data,
      meta: result.meta,
      message: 'Campaigns retrieved successfully',
    };
  }

  @Get('campaigns/:id')
  @RequirePermissions({ resource: 'newsletter', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get campaign details with delivery stats' })
  @ApiResponse({ status: 200, description: 'Campaign details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignDetails(@Param('id') campaignId: string) {
    const campaign = await this.newsletterService.getCampaignDetails(campaignId);
    return {
      data: campaign,
      message: 'Campaign details retrieved successfully',
    };
  }
}
