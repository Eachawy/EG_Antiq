import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { Public } from '../auth/decorators/public.decorator';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';

@ApiTags('Contact')
@Controller('portal/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for anonymous users
  @ApiOperation({ summary: 'Submit a contact message (public)' })
  @ApiResponse({ status: 201, description: 'Message submitted successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async submitMessage(@Body() createDto: CreateContactMessageDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const message = await this.contactService.submitMessage(
      createDto,
      undefined,
      ipAddress,
      userAgent,
    );

    return {
      data: { id: message.id },
      message:
        'Thank you for contacting us! We have received your message and will get back to you soon.',
    };
  }

  @Get('my-messages')
  @UseGuards(PortalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my contact messages (authenticated)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getMyMessages(@CurrentPortalUser() user: any) {
    const messages = await this.contactService.getMyMessages(user.id);
    return {
      data: messages,
      message: 'Messages retrieved successfully',
    };
  }
}
