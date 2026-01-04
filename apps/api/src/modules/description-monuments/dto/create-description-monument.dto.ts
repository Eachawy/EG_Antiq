import { IsString, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDescriptionMonumentDto {
  @ApiProperty({ description: 'Monument ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  monumentId: number;

  @ApiProperty({ description: 'Description in Arabic', example: 'وصف الأثر باللغة العربية' })
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @ApiProperty({ description: 'Description in English', example: 'Monument description in English' })
  @IsString()
  @IsNotEmpty()
  descriptionEn: string;
}
