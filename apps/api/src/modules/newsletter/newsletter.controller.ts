import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser, AuthenticatedPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';

@ApiTags('Newsletter')
@Controller('portal/newsletter')
@Public()
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Subscribe to newsletter (public)' })
  @ApiResponse({ status: 200, description: 'Subscription completed or already active' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    const result = await this.newsletterService.subscribe(subscribeDto);
    return {
      data: result,
      message: result.alreadySubscribed
        ? 'This email is already subscribed to our newsletter.'
        : 'Thank you for subscribing! You will start receiving our newsletters.',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify newsletter subscription' })
  @ApiResponse({ status: 200, description: 'Subscription verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verify(@Query('token') token: string) {
    await this.newsletterService.verify(token);
    return {
      message: 'Your subscription has been verified successfully!',
    };
  }

  @Get('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter (GET for email links)' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async unsubscribeGet(@Query('token') token: string) {
    await this.newsletterService.unsubscribe(token);
    return {
      message: 'You have been successfully unsubscribed from our newsletter.',
      success: true,
    };
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter (POST for API calls)' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token' })
  async unsubscribe(@Query('token') token: string) {
    await this.newsletterService.unsubscribe(token);
    return {
      message: 'You have been unsubscribed from our newsletter.',
    };
  }

  @Get('status')
  @UseGuards(PortalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscription status (authenticated)' })
  @ApiResponse({ status: 200, description: 'Status retrieved successfully' })
  async getStatus(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const status = await this.newsletterService.getStatus(user.sub);
    return {
      data: status,
      message: 'Status retrieved successfully',
    };
  }
}
