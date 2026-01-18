import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortalSettingsService } from './portal-settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser, AuthenticatedPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Portal Settings')
@Controller('portal/settings')
@Public()
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth()
export class PortalSettingsController {
  constructor(private readonly portalSettingsService: PortalSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const settings = await this.portalSettingsService.getSettings(user.sub);
    return {
      data: settings,
      message: 'Settings retrieved successfully',
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@CurrentPortalUser() user: AuthenticatedPortalUser, @Body() updateSettingsDto: UpdateSettingsDto) {
    const settings = await this.portalSettingsService.updateSettings(user.sub, updateSettingsDto);
    return {
      data: settings,
      message: 'Settings updated successfully',
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 400, description: 'Cannot change password for OAuth users' })
  async changePassword(@CurrentPortalUser() user: AuthenticatedPortalUser, @Body() changePasswordDto: ChangePasswordDto) {
    await this.portalSettingsService.changePassword(user.sub, changePasswordDto);
    return {
      message: 'Password changed successfully. Please login again with your new password.',
    };
  }

  @Post('download-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download user data (GDPR)' })
  @ApiResponse({ status: 200, description: 'User data retrieved successfully' })
  async downloadData(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const data = await this.portalSettingsService.downloadUserData(user.sub);
    return {
      data,
      message: 'User data retrieved successfully',
    };
  }
}
