import { IsString, IsNotEmpty, IsInt, IsArray, ValidateNested, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateGalleryItemDto } from './create-gallery-item.dto';
import { CreateDescriptionItemDto } from './create-description-item.dto';

export class CreateMonumentDto {
  @ApiProperty({ description: 'Monument name in Arabic', example: 'معبد الكرنك' })
  @IsString()
  @IsNotEmpty()
  monumentNameAr: string;

  @ApiProperty({ description: 'Monument name in English', example: 'Karnak Temple' })
  @IsString()
  @IsNotEmpty()
  monumentNameEn: string;

  @ApiProperty({ description: 'Monument biography/description in Arabic', example: 'معبد الكرنك هو مجمع معابد ضخم...' })
  @IsString()
  @IsNotEmpty()
  monumentBiographyAr: string;

  @ApiProperty({ description: 'Monument biography/description in English', example: 'The Karnak Temple Complex comprises a vast mix of decayed temples...' })
  @IsString()
  @IsNotEmpty()
  monumentBiographyEn: string;

  @ApiProperty({ description: 'Latitude coordinate', example: '25.718833' })
  @IsString()
  @IsNotEmpty()
  lat: string;

  @ApiProperty({ description: 'Longitude coordinate', example: '32.657444' })
  @IsString()
  @IsNotEmpty()
  lng: string;

  @ApiPropertyOptional({ description: 'Main monument image path', example: 'uploads/monuments/karnak-temple.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'Monument start date', example: '2560 BC' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Monument end date', example: '2540 BC' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Monument start date in Hijri calendar', example: '15/03/1446' })
  @IsString()
  @IsOptional()
  startDateHijri?: string;

  @ApiPropertyOptional({ description: 'Monument end date in Hijri calendar', example: '20/05/1446' })
  @IsString()
  @IsOptional()
  endDateHijri?: string;

  @ApiPropertyOptional({
    description: 'Artifact registration number',
    example: 'SCA-2024-001'
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  artifactRegistrationNumber?: string;

  @ApiPropertyOptional({
    description: 'Custom English slug (auto-generated from monumentNameEn if not provided)',
    example: 'karnak-temple'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slugEn?: string;

  @ApiPropertyOptional({
    description: 'Custom Arabic slug (auto-generated from monumentNameAr if not provided)',
    example: 'maebd-alkrnk'
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slugAr?: string;

  @ApiProperty({ description: 'Monument type ID', example: 1 })
  @IsInt()
  monumentsTypeId: number;

  @ApiProperty({ description: 'Era ID', example: 1 })
  @IsInt()
  eraId: number;

  @ApiProperty({ description: 'Dynasty ID', example: 1 })
  @IsInt()
  dynastyId: number;

  @ApiProperty({ description: 'Map zoom level', example: '11' })
  @IsString()
  @IsNotEmpty()
  zoom: string;

  @ApiProperty({ description: 'Map center coordinates', example: '25.718833,32.657444' })
  @IsString()
  @IsNotEmpty()
  center: string;

  @ApiPropertyOptional({ description: 'Gallery items for the monument', type: [CreateGalleryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGalleryItemDto)
  @IsOptional()
  galleries?: CreateGalleryItemDto[];

  @ApiPropertyOptional({ description: 'Description items for the monument', type: [CreateDescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDescriptionItemDto)
  @IsOptional()
  descriptions?: CreateDescriptionItemDto[];
}
