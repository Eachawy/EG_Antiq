import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MonumentSourcesService } from './monument-sources.service';
import { CreateMonumentSourceDto } from './dto/create-monument-source.dto';
import { UpdateMonumentSourceDto } from './dto/update-monument-source.dto';
import { LinkSourcesToMonumentDto } from './dto/link-sources-to-monument.dto';

@ApiTags('Monument Sources')
@ApiBearerAuth('JWT-auth')
@Controller('monument-sources')
export class MonumentSourcesController {
  constructor(private readonly monumentSourcesService: MonumentSourcesService) {}

  /**
   * GET /api/v1/monument-sources
   * Get all monument-source links
   */
  @Get()
  @ApiOperation({ summary: 'Get all monument-source links' })
  @ApiResponse({ status: 200, description: 'Returns list of all monument-source links' })
  async findAll() {
    const links = await this.monumentSourcesService.findAll();
    return {
      data: links,
      meta: {
        total: links.length,
      },
    };
  }

  /**
   * GET /api/v1/monument-sources/:id
   * Get a single monument-source link by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get monument-source link by ID' })
  @ApiParam({ name: 'id', description: 'Link ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns monument-source link details' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const link = await this.monumentSourcesService.findOne(id);
    return {
      data: link,
    };
  }

  /**
   * GET /api/v1/monument-sources/monument/:monumentId
   * Get all sources for a specific monument
   */
  @Get('monument/:monumentId')
  @ApiOperation({ summary: 'Get all sources for a monument' })
  @ApiParam({ name: 'monumentId', description: 'Monument ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns list of sources for the monument' })
  async findByMonument(@Param('monumentId', ParseIntPipe) monumentId: number) {
    const sources = await this.monumentSourcesService.findByMonumentId(monumentId);
    return {
      data: sources,
      meta: {
        total: sources.length,
      },
    };
  }

  /**
   * POST /api/v1/monument-sources
   * Create a new monument-source link
   */
  @Post()
  @ApiOperation({ summary: 'Link a source to a monument' })
  @ApiResponse({ status: 201, description: 'Monument-source link created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Monument or source not found' })
  async create(@Body() createDto: CreateMonumentSourceDto) {
    const link = await this.monumentSourcesService.create(createDto);
    return {
      data: link,
      message: 'Monument-source link created successfully',
    };
  }

  /**
   * POST /api/v1/monument-sources/bulk
   * Bulk link multiple sources to a monument
   */
  @Post('bulk')
  @ApiOperation({ summary: 'Bulk link multiple sources to a monument' })
  @ApiResponse({ status: 201, description: 'Sources linked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Monument or one or more sources not found' })
  async bulkLink(@Body() dto: LinkSourcesToMonumentDto) {
    const result = await this.monumentSourcesService.bulkLinkToMonument(dto);
    return result;
  }

  /**
   * PATCH /api/v1/monument-sources/:id
   * Update monument-source link by ID
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update monument-source link' })
  @ApiParam({ name: 'id', description: 'Link ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-source link updated successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMonumentSourceDto,
  ) {
    const link = await this.monumentSourcesService.update(id, updateDto);
    return {
      data: link,
      message: 'Monument-source link updated successfully',
    };
  }

  /**
   * DELETE /api/v1/monument-sources/:id
   * Delete monument-source link by ID
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete monument-source link by ID' })
  @ApiParam({ name: 'id', description: 'Link ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-source link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentSourcesService.remove(id);
    return result;
  }

  /**
   * DELETE /api/v1/monument-sources/monument/:monumentId/source/:sourceId
   * Delete specific monument-source link
   */
  @Delete('monument/:monumentId/source/:sourceId')
  @ApiOperation({ summary: 'Delete monument-source link by monument and source IDs' })
  @ApiParam({ name: 'monumentId', description: 'Monument ID', example: 1 })
  @ApiParam({ name: 'sourceId', description: 'Source ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-source link deleted successfully' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  async removeByIds(
    @Param('monumentId', ParseIntPipe) monumentId: number,
    @Param('sourceId', ParseIntPipe) sourceId: number,
  ) {
    const result = await this.monumentSourcesService.removeByMonumentAndSource(monumentId, sourceId);
    return result;
  }
}
