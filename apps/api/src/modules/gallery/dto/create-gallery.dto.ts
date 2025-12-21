import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGalleryDto {
  @ApiProperty({ description: 'Path to gallery image', example: 'uploads/gallery/image.jpg' })
  @IsString()
  @IsNotEmpty()
  galleryPath: string;

  @ApiProperty({ description: 'Dynasty ID', example: 1 })
  @IsInt()
  dynastyId: number;

  @ApiProperty({ description: 'Era ID', example: 1 })
  @IsInt()
  eraId: number;

  @ApiProperty({ description: 'Monument type ID', example: 1 })
  @IsInt()
  monumentsTypeId: number;

  @ApiProperty({ description: 'Monument ID', example: 1 })
  @IsInt()
  monumentsId: number;
}
