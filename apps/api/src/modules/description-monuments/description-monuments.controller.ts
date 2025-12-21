import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DescriptionMonumentsService } from './description-monuments.service';
import { CreateDescriptionMonumentDto } from './dto/create-description-monument.dto';
import { UpdateDescriptionMonumentDto } from './dto/update-description-monument.dto';

@ApiTags('Descriptions')
@ApiBearerAuth('JWT-auth')
@Controller('description-monuments')
export class DescriptionMonumentsController {
  constructor(private readonly descriptionMonumentsService: DescriptionMonumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all monument descriptions' })
  @ApiResponse({ status: 200, description: 'Returns list of all monument descriptions' })
  async findAll() {
    const descriptions = await this.descriptionMonumentsService.findAll();
    return {
      data: descriptions,
      meta: {
        total: descriptions.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get monument description by ID' })
  @ApiParam({ name: 'id', description: 'Description ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns description details' })
  @ApiResponse({ status: 404, description: 'Description not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const description = await this.descriptionMonumentsService.findOne(id);
    return {
      data: description,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new monument description' })
  @ApiResponse({ status: 201, description: 'Description created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createDescriptionMonumentDto: CreateDescriptionMonumentDto) {
    const description = await this.descriptionMonumentsService.create(createDescriptionMonumentDto);
    return {
      data: description,
      message: 'Description monument created successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update monument description by ID' })
  @ApiParam({ name: 'id', description: 'Description ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Description updated successfully' })
  @ApiResponse({ status: 404, description: 'Description not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDescriptionMonumentDto: UpdateDescriptionMonumentDto,
  ) {
    const description = await this.descriptionMonumentsService.update(id, updateDescriptionMonumentDto);
    return {
      data: description,
      message: 'Description monument updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete monument description by ID' })
  @ApiParam({ name: 'id', description: 'Description ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Description deleted successfully' })
  @ApiResponse({ status: 404, description: 'Description not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.descriptionMonumentsService.remove(id);
    return result;
  }
}
