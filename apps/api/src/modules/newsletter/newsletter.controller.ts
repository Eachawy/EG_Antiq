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
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Subscribe to newsletter (public)' })
  @ApiResponse({ status: 201, description: 'Subscription initiated successfully' })
  @ApiResponse({ status: 409, description: 'Email already subscribed' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async subscribe(@Body() subscribeDto: SubscribeDto) {
    const result = await this.newsletterService.subscribe(subscribeDto);
    return {
      data: result,
      message:
        'Thank you for subscribing! Please check your email to verify your subscription.',
    };
  }

  @Post('verify')
  @Public()
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

  @Post('unsubscribe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
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
