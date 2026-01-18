import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { UpdateSavedSearchDto } from './dto/update-saved-search.dto';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser, AuthenticatedPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Saved Searches')
@Controller('portal/saved-searches')
@Public()
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth()
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all saved searches' })
  @ApiResponse({ status: 200, description: 'Saved searches retrieved successfully' })
  async getSavedSearches(@CurrentPortalUser() user: AuthenticatedPortalUser) {
    const savedSearches = await this.savedSearchesService.getSavedSearches(user.sub);
    return {
      data: savedSearches,
      message: 'Saved searches retrieved successfully',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new saved search' })
  @ApiResponse({ status: 201, description: 'Saved search created successfully' })
  async createSavedSearch(
    @CurrentPortalUser() user: AuthenticatedPortalUser,
    @Body() createDto: CreateSavedSearchDto,
  ) {
    const savedSearch = await this.savedSearchesService.createSavedSearch(user.sub, createDto);
    return {
      data: savedSearch,
      message: 'Saved search created successfully',
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search updated successfully' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateSavedSearch(
    @CurrentPortalUser() user: AuthenticatedPortalUser,
    @Param('id') savedSearchId: string,
    @Body() updateDto: UpdateSavedSearchDto,
  ) {
    const savedSearch = await this.savedSearchesService.updateSavedSearch(
      user.sub,
      savedSearchId,
      updateDto,
    );
    return {
      data: savedSearch,
      message: 'Saved search updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved search' })
  @ApiResponse({ status: 200, description: 'Saved search deleted successfully' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteSavedSearch(@CurrentPortalUser() user: AuthenticatedPortalUser, @Param('id') savedSearchId: string) {
    await this.savedSearchesService.deleteSavedSearch(user.sub, savedSearchId);
    return {
      message: 'Saved search deleted successfully',
    };
  }

  @Post(':id/run')
  @ApiOperation({ summary: 'Execute a saved search' })
  @ApiResponse({ status: 200, description: 'Search executed successfully' })
  @ApiResponse({ status: 404, description: 'Saved search not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async executeSavedSearch(@CurrentPortalUser() user: AuthenticatedPortalUser, @Param('id') savedSearchId: string) {
    const result = await this.savedSearchesService.executeSavedSearch(user.sub, savedSearchId);
    return {
      data: result,
      message: 'Search executed successfully',
    };
  }
}
