import { IsString, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateGalleryItemDto } from './update-gallery-item.dto';
import { UpdateDescriptionItemDto } from './update-description-item.dto';

export class UpdateMonumentDto {
  @IsString()
  @IsOptional()
  monumentNameAr?: string;

  @IsString()
  @IsOptional()
  monumentNameEn?: string;

  @IsString()
  @IsOptional()
  monumentBiographyAr?: string;

  @IsString()
  @IsOptional()
  monumentBiographyEn?: string;

  @IsString()
  @IsOptional()
  lat?: string;

  @IsString()
  @IsOptional()
  lng?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  startDateHijri?: string;

  @IsString()
  @IsOptional()
  endDateHijri?: string;

  @IsInt()
  @IsOptional()
  monumentsTypeId?: number;

  @IsInt()
  @IsOptional()
  eraId?: number;

  @IsInt()
  @IsOptional()
  dynastyId?: number;

  @IsString()
  @IsOptional()
  zoom?: string;

  @IsString()
  @IsOptional()
  center?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGalleryItemDto)
  @IsOptional()
  galleries?: UpdateGalleryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateDescriptionItemDto)
  @IsOptional()
  descriptions?: UpdateDescriptionItemDto[];
}
