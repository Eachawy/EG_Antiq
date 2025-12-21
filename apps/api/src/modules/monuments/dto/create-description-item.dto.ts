import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDescriptionItemDto {
  @ApiProperty({ description: 'Description in Arabic', example: 'وصف تفصيلي للمعلم الأثري...' })
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @ApiProperty({ description: 'Description in English', example: 'Detailed description of the monument...' })
  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @ApiPropertyOptional({ description: 'Era ID', example: 1 })
  @IsInt()
  @IsOptional()
  eraId?: number;

  @ApiPropertyOptional({ description: 'Monument type ID', example: 1 })
  @IsInt()
  @IsOptional()
  monumentsTypeId?: number;

  @ApiPropertyOptional({ description: 'Dynasty ID', example: 1 })
  @IsInt()
  @IsOptional()
  dynastyId?: number;
}
