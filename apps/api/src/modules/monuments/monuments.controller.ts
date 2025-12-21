import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MonumentsService } from './monuments.service';
import { CreateMonumentDto } from './dto/create-monument.dto';
import { UpdateMonumentDto } from './dto/update-monument.dto';

@ApiTags('Monuments')
@ApiBearerAuth('JWT-auth')
@Controller('monuments')
export class MonumentsController {
  constructor(private readonly monumentsService: MonumentsService) {}

  /**
   * GET /api/v1/monuments
   * Get all monuments
   */
  @Get()
  @ApiOperation({ summary: 'Get all monuments' })
  @ApiResponse({ status: 200, description: 'Returns list of all monuments' })
  async findAll() {
    const monuments = await this.monumentsService.findAll();
    return {
      data: monuments,
      meta: {
        total: monuments.length,
      },
    };
  }

  /**
   * GET /api/v1/monuments/:id
   * Get a single monument by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get monument by ID' })
  @ApiParam({ name: 'id', description: 'Monument ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns monument details' })
  @ApiResponse({ status: 404, description: 'Monument not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const monument = await this.monumentsService.findOne(id);
    return {
      data: monument,
    };
  }

  /**
   * POST /api/v1/monuments
   * Create a new monument
   */
  @Post()
  @ApiOperation({ summary: 'Create a new monument' })
  @ApiResponse({ status: 201, description: 'Monument created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createMonumentDto: CreateMonumentDto) {
    const monument = await this.monumentsService.create(createMonumentDto);
    return {
      data: monument,
      message: 'Monument created successfully',
    };
  }

  /**
   * PATCH /api/v1/monuments/:id
   * Update a monument
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update monument by ID' })
  @ApiParam({ name: 'id', description: 'Monument ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument updated successfully' })
  @ApiResponse({ status: 404, description: 'Monument not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonumentDto: UpdateMonumentDto,
  ) {
    const monument = await this.monumentsService.update(id, updateMonumentDto);
    return {
      data: monument,
      message: 'Monument updated successfully',
    };
  }

  /**
   * DELETE /api/v1/monuments/:id
   * Delete a monument
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete monument by ID' })
  @ApiParam({ name: 'id', description: 'Monument ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument deleted successfully' })
  @ApiResponse({ status: 404, description: 'Monument not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentsService.remove(id);
    return result;
  }
}
