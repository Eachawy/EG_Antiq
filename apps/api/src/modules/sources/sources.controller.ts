import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SourcesService } from './sources.service';
import { CreateSourceDto } from './dto/create-source.dto';
import { UpdateSourceDto } from './dto/update-source.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Sources')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  /**
   * GET /api/v1/sources
   * Get all sources
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all sources (PUBLIC)' })
  @ApiResponse({ status: 200, description: 'Returns list of all sources with monument counts' })
  async findAll() {
    const sources = await this.sourcesService.findAll();
    return {
      data: sources,
      meta: {
        total: sources.length,
      },
    };
  }

  /**
   * GET /api/v1/sources/:id
   * Get a single source by ID
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get source by ID (PUBLIC)' })
  @ApiParam({ name: 'id', description: 'Source ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns source details with monument count' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const source = await this.sourcesService.findOne(id);
    return {
      data: source,
    };
  }

  /**
   * POST /api/v1/sources
   * Create a new source
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new source (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Source created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createSourceDto: CreateSourceDto) {
    const source = await this.sourcesService.create(createSourceDto);
    return {
      data: source,
      message: 'Source created successfully',
    };
  }

  /**
   * POST /api/v1/sources/import-csv
   * Import sources from CSV file
   */
  @Post('import-csv')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import sources from CSV file (ADMIN)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: titleEn,titleAr,authorEn,authorAr,publicationYear,publisher,sourceType,url,pages,volume,issue,isbn,doi,notes',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV import completed' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid CSV format' })
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV file');
    }

    const result = await this.sourcesService.importFromCsv(file);
    return result;
  }

  /**
   * PATCH /api/v1/sources/:id
   * Update source by ID
   */
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update source by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Source ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Source updated successfully' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSourceDto: UpdateSourceDto,
  ) {
    const source = await this.sourcesService.update(id, updateSourceDto);
    return {
      data: source,
      message: 'Source updated successfully',
    };
  }

  /**
   * DELETE /api/v1/sources/:id
   * Delete source by ID
   */
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete source by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Source ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Source deleted successfully' })
  @ApiResponse({ status: 404, description: 'Source not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.sourcesService.remove(id);
    return result;
  }
}
