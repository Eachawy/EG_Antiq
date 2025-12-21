import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGalleryItemDto {
  @ApiProperty({ description: 'Path to gallery image', example: 'uploads/gallery/karnak-image.jpg' })
  @IsString()
  @IsNotEmpty()
  galleryPath: string;

  @ApiPropertyOptional({ description: 'Dynasty ID', example: 1 })
  @IsInt()
  @IsOptional()
  dynastyId?: number;

  @ApiPropertyOptional({ description: 'Era ID', example: 1 })
  @IsInt()
  @IsOptional()
  eraId?: number;

  @ApiPropertyOptional({ description: 'Monument type ID', example: 1 })
  @IsInt()
  @IsOptional()
  monumentsTypeId?: number;
}
