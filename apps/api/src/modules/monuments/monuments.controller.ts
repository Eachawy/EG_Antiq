import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { MonumentsService } from './monuments.service';
import { CreateMonumentDto } from './dto/create-monument.dto';
import { UpdateMonumentDto } from './dto/update-monument.dto';

@Controller('monuments')
export class MonumentsController {
  constructor(private readonly monumentsService: MonumentsService) {}

  /**
   * GET /api/v1/monuments
   * Get all monuments
   */
  @Get()
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentsService.remove(id);
    return result;
  }
}
