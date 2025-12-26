import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DynastiesService } from './dynasties.service';
import { CreateDynastyDto } from './dto/create-dynasty.dto';
import { UpdateDynastyDto } from './dto/update-dynasty.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Dynasties')
@Controller('dynasties')
export class DynastiesController {
  constructor(private readonly dynastiesService: DynastiesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all dynasties (PUBLIC)' })
  @ApiResponse({ status: 200, description: 'Returns list of all Egyptian dynasties' })
  async findAll() {
    const dynasties = await this.dynastiesService.findAll();
    return {
      data: dynasties,
      meta: {
        total: dynasties.length,
      },
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get dynasty by ID (PUBLIC)' })
  @ApiParam({ name: 'id', description: 'Dynasty ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns dynasty details' })
  @ApiResponse({ status: 404, description: 'Dynasty not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const dynasty = await this.dynastiesService.findOne(id);
    return {
      data: dynasty,
    };
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new dynasty (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Dynasty created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createDynastyDto: CreateDynastyDto) {
    const dynasty = await this.dynastiesService.create(createDynastyDto);
    return {
      data: dynasty,
      message: 'Dynasty created successfully',
    };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update dynasty by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Dynasty ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Dynasty updated successfully' })
  @ApiResponse({ status: 404, description: 'Dynasty not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDynastyDto: UpdateDynastyDto,
  ) {
    const dynasty = await this.dynastiesService.update(id, updateDynastyDto);
    return {
      data: dynasty,
      message: 'Dynasty updated successfully',
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete dynasty by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Dynasty ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Dynasty deleted successfully' })
  @ApiResponse({ status: 404, description: 'Dynasty not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.dynastiesService.remove(id);
    return result;
  }
}
