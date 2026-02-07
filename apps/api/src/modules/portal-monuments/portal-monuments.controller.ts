import { Controller, Get, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { PortalMonumentsService } from './portal-monuments.service';
import { SearchFiltersDto } from './dto/search-filters.dto';
import { Public } from '../auth/decorators/public.decorator';
import { parseMonumentUrl } from '@packages/common';

@ApiTags('Portal Monuments')
@Controller('portal/monuments')
@Public() // All portal monument endpoints are public
export class PortalMonumentsController {
  constructor(private readonly portalMonumentsService: PortalMonumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all monuments (PUBLIC) - omit limit to get all results' })
  @ApiResponse({ status: 200, description: 'All monuments retrieved successfully' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Req() req?: Request) {
    // Extract portal user from JWT if present (optional authentication)
    const portalUserId = (req?.user as any)?.id;

    const result = await this.portalMonumentsService.findAll(
      page || 1,
      limit,
      portalUserId
    );

    return {
      ...result,
      message: 'All monuments retrieved successfully',
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search monuments with filters (PUBLIC)' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(@Query() searchFiltersDto: SearchFiltersDto, @Req() req: Request) {
    // Extract portal user from JWT if present (optional authentication)
    const portalUserId = (req.user as any)?.id;

    const result = await this.portalMonumentsService.search(searchFiltersDto, portalUserId);
    return {
      ...result,
      message: 'Search results retrieved successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monument details by ID or ID-slug (PUBLIC)' })
  @ApiResponse({ status: 200, description: 'Monument details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Monument not found' })
  async getById(@Param('id') idOrSlug: string, @Req() req: Request) {
    // Extract portal user from JWT if present (optional authentication)
    const portalUserId = (req.user as any)?.id;

    // Parse ID from "21" or "21-slug" format
    const { id } = parseMonumentUrl(idOrSlug);

    const monument = await this.portalMonumentsService.getById(id, portalUserId);
    return {
      data: monument,
      message: 'Monument details retrieved successfully',
    };
  }
}
