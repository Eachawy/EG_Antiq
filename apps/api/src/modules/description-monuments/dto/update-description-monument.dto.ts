import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDescriptionMonumentDto {
  @ApiProperty({ description: 'Monument ID', example: 1, required: false })
  @IsInt()
  @IsOptional()
  monumentId?: number;

  @ApiProperty({ description: 'Description in Arabic', example: 'وصف الأثر باللغة العربية', required: false })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({ description: 'Description in English', example: 'Monument description in English', required: false })
  @IsString()
  @IsOptional()
  descriptionEn?: string;
}
