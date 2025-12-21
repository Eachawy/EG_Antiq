import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ErasService } from './eras.service';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';

@ApiTags('Eras')
@ApiBearerAuth('JWT-auth')
@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  @Get()
  @ApiOperation({ summary: 'Get all eras' })
  @ApiResponse({ status: 200, description: 'Returns list of all historical eras' })
  async findAll() {
    const eras = await this.erasService.findAll();
    return {
      data: eras,
      meta: {
        total: eras.length,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get era by ID' })
  @ApiParam({ name: 'id', description: 'Era ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Returns era details' })
  @ApiResponse({ status: 404, description: 'Era not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const era = await this.erasService.findOne(id);
    return {
      data: era,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new era' })
  @ApiResponse({ status: 201, description: 'Era created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createEraDto: CreateEraDto) {
    const era = await this.erasService.create(createEraDto);
    return {
      data: era,
      message: 'Era created successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update era by ID' })
  @ApiParam({ name: 'id', description: 'Era ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Era updated successfully' })
  @ApiResponse({ status: 404, description: 'Era not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEraDto: UpdateEraDto,
  ) {
    const era = await this.erasService.update(id, updateEraDto);
    return {
      data: era,
      message: 'Era updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete era by ID' })
  @ApiParam({ name: 'id', description: 'Era ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Era deleted successfully' })
  @ApiResponse({ status: 404, description: 'Era not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.erasService.remove(id);
    return result;
  }
}
