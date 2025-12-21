import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MonumentTypesService } from './monument-types.service';
import { CreateMonumentTypeDto } from './dto/create-monument-type.dto';
import { UpdateMonumentTypeDto } from './dto/update-monument-type.dto';

@ApiTags('Monument Types')
@ApiBearerAuth('JWT-auth')
@Controller('monument-types')
export class MonumentTypesController {
  constructor(private readonly monumentTypesService: MonumentTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all monument types' })
  @ApiResponse({ status: 200, description: 'Returns list of all monument types (temple, tomb, etc.)' })
  async findAll() {
    const types = await this.monumentTypesService.findAll();
    return {
      data: types,
      meta: {
        total: types.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monument type by ID' })
  @ApiParam({ name: 'id', description: 'Monument type ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns monument type details' })
  @ApiResponse({ status: 404, description: 'Monument type not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const type = await this.monumentTypesService.findOne(id);
    return {
      data: type,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new monument type' })
  @ApiResponse({ status: 201, description: 'Monument type created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createMonumentTypeDto: CreateMonumentTypeDto) {
    const type = await this.monumentTypesService.create(createMonumentTypeDto);
    return {
      data: type,
      message: 'Monument type created successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update monument type by ID' })
  @ApiParam({ name: 'id', description: 'Monument type ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument type updated successfully' })
  @ApiResponse({ status: 404, description: 'Monument type not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonumentTypeDto: UpdateMonumentTypeDto,
  ) {
    const type = await this.monumentTypesService.update(id, updateMonumentTypeDto);
    return {
      data: type,
      message: 'Monument type updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete monument type by ID' })
  @ApiParam({ name: 'id', description: 'Monument type ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument type deleted successfully' })
  @ApiResponse({ status: 404, description: 'Monument type not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentTypesService.remove(id);
    return result;
  }
}
