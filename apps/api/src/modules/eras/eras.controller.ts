import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ErasService } from './eras.service';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Eras')
@Controller('eras')
export class ErasController {
  constructor(private readonly erasService: ErasService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all eras (PUBLIC)' })
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
  @Public()
  @ApiOperation({ summary: 'Get era by ID (PUBLIC)' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new era (ADMIN)' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update era by ID (ADMIN)' })
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
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete era by ID (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Era ID', example: 1 })
  @ApiResponse({ status: 200, description: 'Era deleted successfully' })
  @ApiResponse({ status: 404, description: 'Era not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.erasService.remove(id);
    return result;
  }
}
