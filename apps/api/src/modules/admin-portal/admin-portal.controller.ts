import {
  Controller,
  Get,
  Delete,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminPortalService } from './admin-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../favorites/dto/pagination.dto';
import { UpdateSettingsDto } from '../portal-settings/dto/update-settings.dto';

@ApiTags('Admin Portal Management')
@Controller('admin/portal-users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminPortalController {
  constructor(private readonly adminPortalService: AdminPortalService) {}

  // ==================== Portal Users Management ====================

  @Get()
  @RequirePermissions({ resource: 'portal-users', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get all portal users' })
  @ApiResponse({ status: 200, description: 'Portal users retrieved successfully' })
  async getAllPortalUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.adminPortalService.getAllPortalUsers({
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
      search,
      status,
    });

    return {
      ...result,
      message: 'Portal users retrieved successfully',
    };
  }

  @Get(':id')
  @RequirePermissions({ resource: 'portal-users', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get portal user details' })
  @ApiResponse({ status: 200, description: 'Portal user retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portal user not found' })
  async getPortalUser(@Param('id') portalUserId: string) {
    const user = await this.adminPortalService.getPortalUserById(portalUserId);
    return {
      data: user,
      message: 'Portal user retrieved successfully',
    };
  }

  @Get(':id/stats')
  @RequirePermissions({ resource: 'portal-users', action: 'read' })
  @ApiOperation({ summary: '[Admin] Get portal user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getPortalUserStats(@Param('id') portalUserId: string) {
    const stats = await this.adminPortalService.getPortalUserStats(portalUserId);
    return {
      data: stats,
      message: 'Portal user statistics retrieved successfully',
    };
  }

  @Patch(':id/status')
  @RequirePermissions({ resource: 'portal-users', action: 'update' })
  @ApiOperation({ summary: '[Admin] Update portal user status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updatePortalUserStatus(
    @Param('id') portalUserId: string,
    @Body('status') status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const user = await this.adminPortalService.updatePortalUserStatus(
      portalUserId,
      status,
      admin.id,
    );
    return {
      data: user,
      message: 'Portal user status updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ resource: 'portal-users', action: 'delete' })
  @ApiOperation({ summary: '[Admin] Delete portal user account' })
  @ApiResponse({ status: 200, description: 'Portal user deleted successfully' })
  async deletePortalUser(
    @Param('id') portalUserId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    await this.adminPortalService.deletePortalUser(portalUserId, admin.id);
    return {
      message: 'Portal user deleted successfully',
    };
  }

  // ==================== Favorites Management ====================

  @Get(':id/favorites')
  @RequirePermissions({ resource: 'portal-favorites', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Get portal user favorites' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async getPortalUserFavorites(
    @Param('id') portalUserId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.adminPortalService.getPortalUserFavorites(
      portalUserId,
      paginationDto,
    );
    return {
      ...result,
      message: 'Portal user favorites retrieved successfully',
    };
  }

  @Delete(':id/favorites/:favoriteId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ resource: 'portal-favorites', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Delete specific favorite' })
  @ApiResponse({ status: 200, description: 'Favorite deleted successfully' })
  async deletePortalUserFavorite(
    @Param('id') portalUserId: string,
    @Param('favoriteId') favoriteId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    await this.adminPortalService.deletePortalUserFavorite(portalUserId, favoriteId, admin.id);
    return {
      message: 'Favorite deleted successfully',
    };
  }

  @Delete(':id/favorites')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ resource: 'portal-favorites', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Clear all favorites for portal user' })
  @ApiResponse({ status: 200, description: 'All favorites cleared successfully' })
  async clearPortalUserFavorites(
    @Param('id') portalUserId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const result = await this.adminPortalService.clearPortalUserFavorites(portalUserId, admin.id);
    return {
      ...result,
      message: 'All favorites cleared successfully',
    };
  }

  // ==================== Browsing History Management ====================

  @Get(':id/history')
  @RequirePermissions({ resource: 'portal-history', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Get portal user browsing history' })
  @ApiResponse({ status: 200, description: 'Browsing history retrieved successfully' })
  async getPortalUserHistory(
    @Param('id') portalUserId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    const result = await this.adminPortalService.getPortalUserHistory(portalUserId, paginationDto);
    return {
      ...result,
      message: 'Browsing history retrieved successfully',
    };
  }

  @Delete(':id/history')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ resource: 'portal-history', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Clear portal user browsing history' })
  @ApiResponse({ status: 200, description: 'Browsing history cleared successfully' })
  async clearPortalUserHistory(
    @Param('id') portalUserId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const result = await this.adminPortalService.clearPortalUserHistory(portalUserId, admin.id);
    return {
      ...result,
      message: 'Browsing history cleared successfully',
    };
  }

  // ==================== Saved Searches Management ====================

  @Get(':id/saved-searches')
  @RequirePermissions({ resource: 'portal-searches', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Get portal user saved searches' })
  @ApiResponse({ status: 200, description: 'Saved searches retrieved successfully' })
  async getPortalUserSavedSearches(@Param('id') portalUserId: string) {
    const searches = await this.adminPortalService.getPortalUserSavedSearches(portalUserId);
    return {
      data: searches,
      message: 'Saved searches retrieved successfully',
    };
  }

  @Delete(':id/saved-searches/:searchId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions({ resource: 'portal-searches', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Delete specific saved search' })
  @ApiResponse({ status: 200, description: 'Saved search deleted successfully' })
  async deletePortalUserSavedSearch(
    @Param('id') portalUserId: string,
    @Param('searchId') searchId: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    await this.adminPortalService.deletePortalUserSavedSearch(portalUserId, searchId, admin.id);
    return {
      message: 'Saved search deleted successfully',
    };
  }

  // ==================== Settings Management ====================

  @Get(':id/settings')
  @RequirePermissions({ resource: 'portal-settings', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Get portal user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getPortalUserSettings(@Param('id') portalUserId: string) {
    const settings = await this.adminPortalService.getPortalUserSettings(portalUserId);
    return {
      data: settings,
      message: 'Portal user settings retrieved successfully',
    };
  }

  @Put(':id/settings')
  @RequirePermissions({ resource: 'portal-settings', action: 'manage' })
  @ApiOperation({ summary: '[Admin] Update portal user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updatePortalUserSettings(
    @Param('id') portalUserId: string,
    @Body() updateDto: UpdateSettingsDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const settings = await this.adminPortalService.updatePortalUserSettings(
      portalUserId,
      updateDto,
      admin.id,
    );
    return {
      data: settings,
      message: 'Portal user settings updated successfully',
    };
  }
}
