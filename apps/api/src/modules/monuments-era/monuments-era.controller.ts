import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MonumentsEraService } from './monuments-era.service';
import { CreateMonumentEraDto } from './dto/create-monument-era.dto';
import { UpdateMonumentEraDto } from './dto/update-monument-era.dto';

@ApiTags('Monuments Era')
@ApiBearerAuth('JWT-auth')
@Controller('monuments-era')
export class MonumentsEraController {
  constructor(private readonly monumentsEraService: MonumentsEraService) {}

  @Get()
  @ApiOperation({ summary: 'Get all monument-era relationships' })
  @ApiResponse({ status: 200, description: 'Returns list of all monument-era relationships' })
  async findAll() {
    const monumentsEra = await this.monumentsEraService.findAll();
    return {
      data: monumentsEra,
      meta: {
        total: monumentsEra.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monument-era relationship by ID' })
  @ApiParam({ name: 'id', description: 'Monument-era relationship ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns monument-era relationship details' })
  @ApiResponse({ status: 404, description: 'Monument-era relationship not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const monumentEra = await this.monumentsEraService.findOne(id);
    return {
      data: monumentEra,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new monument-era relationship' })
  @ApiResponse({ status: 201, description: 'Monument-era relationship created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createMonumentEraDto: CreateMonumentEraDto) {
    const monumentEra = await this.monumentsEraService.create(createMonumentEraDto);
    return {
      data: monumentEra,
      message: 'Monument-era relationship created successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update monument-era relationship by ID' })
  @ApiParam({ name: 'id', description: 'Monument-era relationship ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-era relationship updated successfully' })
  @ApiResponse({ status: 404, description: 'Monument-era relationship not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMonumentEraDto: UpdateMonumentEraDto,
  ) {
    const monumentEra = await this.monumentsEraService.update(id, updateMonumentEraDto);
    return {
      data: monumentEra,
      message: 'Monument-era relationship updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete monument-era relationship by ID' })
  @ApiParam({ name: 'id', description: 'Monument-era relationship ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Monument-era relationship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Monument-era relationship not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.monumentsEraService.remove(id);
    return result;
  }
}
