import { Controller, Get, Patch, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PortalUsersService } from './portal-users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser, AuthenticatedPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Portal Users')
@Controller('portal/users')
@Public()
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth()
export class PortalUsersController {
  constructor(private readonly portalUsersService: PortalUsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const profile = await this.portalUsersService.getProfile(user.sub);
    return {
      data: profile,
      message: 'Profile retrieved successfully',
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@CurrentPortalUser() user: AuthenticatedPortalUser, @Body() updateProfileDto: UpdateProfileDto) {
    const profile = await this.portalUsersService.updateProfile(user.sub, updateProfileDto);
    return {
      data: profile,
      message: 'Profile updated successfully',
    };
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteAccount(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    await this.portalUsersService.deleteAccount(user.sub);
    return {
      message: 'Account deleted successfully',
    };
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserStats(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const stats = await this.portalUsersService.getUserStats(user.sub);
    return {
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }
}
