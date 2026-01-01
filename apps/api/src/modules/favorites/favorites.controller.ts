import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PortalJwtAuthGuard } from '../portal-auth/guards/portal-jwt-auth.guard';
import { CurrentPortalUser, AuthenticatedPortalUser } from '../portal-auth/decorators/current-portal-user.decorator';

@ApiTags('Favorites')
@Controller('portal/favorites')
@UseGuards(PortalJwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favorites with pagination' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  async getFavorites(@CurrentPortalUser() user: AuthenticatedPortalUser, @Query() paginationDto: PaginationDto) {
    const result = await this.favoritesService.getFavorites(user.sub, paginationDto);
    return {
      ...result,
      message: 'Favorites retrieved successfully',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Add a monument to favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  @ApiResponse({ status: 404, description: 'Monument not found' })
  @ApiResponse({ status: 409, description: 'Monument already in favorites' })
  async addFavorite(@CurrentPortalUser() user: AuthenticatedPortalUser, @Body() createFavoriteDto: CreateFavoriteDto) {
    const favorite = await this.favoritesService.addFavorite(user.sub, createFavoriteDto);
    return {
      data: favorite,
      message: 'Favorite added successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a monument from favorites' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeFavorite(@CurrentPortalUser() user: AuthenticatedPortalUser, @Param('id') favoriteId: string) {
    await this.favoritesService.removeFavorite(user.sub, favoriteId);
    return {
      message: 'Favorite removed successfully',
    };
  }

  @Get('check/:monumentId')
  @ApiOperation({ summary: 'Check if a monument is favorited' })
  @ApiResponse({ status: 200, description: 'Check completed successfully' })
  async checkFavorite(@CurrentPortalUser() user: AuthenticatedPortalUser, @Param('monumentId') monumentId: string) {
    const result = await this.favoritesService.checkFavorite(user.sub, parseInt(monumentId));
    return {
      data: result,
      message: 'Check completed successfully',
    };
  }
}
