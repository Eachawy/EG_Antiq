import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrowsingHistoryService } from './browsing-history.service';
import { TrackVisitDto } from './dto/track-visit.dto';
import { PaginationDto } from '../favorites/dto/pagination.dto';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser, AuthenticatedPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';

@ApiTags('Browsing History')
@Controller('portal/history')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth()
export class BrowsingHistoryController {
  constructor(private readonly browsingHistoryService: BrowsingHistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get browsing history with pagination' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getHistory(@CurrentPortalUser() user: AuthenticatedPortalUser, @Query() paginationDto: PaginationDto) {
    const result = await this.browsingHistoryService.getHistory(user.sub, paginationDto);
    return {
      ...result,
      message: 'History retrieved successfully',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Track a monument visit' })
  @ApiResponse({ status: 201, description: 'Visit tracked successfully' })
  @ApiResponse({ status: 404, description: 'Monument not found' })
  async trackVisit(@CurrentPortalUser() user: AuthenticatedPortalUser, @Body() trackVisitDto: TrackVisitDto) {
    const entry = await this.browsingHistoryService.trackVisit(user.sub, trackVisitDto);
    return {
      data: entry,
      message: 'Visit tracked successfully',
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all browsing history' })
  @ApiResponse({ status: 200, description: 'History cleared successfully' })
  async clearHistory(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const result = await this.browsingHistoryService.clearHistory(user.sub);
    return {
      data: result,
      message: 'History cleared successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specific history entry' })
  @ApiResponse({ status: 200, description: 'Entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteEntry(@CurrentPortalUser() user: AuthenticatedPortalUser, @Param('id') entryId: string) {
    await this.browsingHistoryService.deleteEntry(user.sub, entryId);
    return {
      message: 'Entry deleted successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get browsing statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const stats = await this.browsingHistoryService.getStats(user.sub);
    return {
      data: stats,
      message: 'Statistics retrieved successfully',
    };
  }
}
