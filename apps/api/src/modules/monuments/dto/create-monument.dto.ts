import { IsString, IsNotEmpty, IsInt, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGalleryItemDto } from './create-gallery-item.dto';
import { CreateDescriptionItemDto } from './create-description-item.dto';

export class CreateMonumentDto {
  @IsString()
  @IsNotEmpty()
  monumentNameAr: string;

  @IsString()
  @IsNotEmpty()
  monumentNameEn: string;

  @IsString()
  @IsNotEmpty()
  monumentBiographyAr: string;

  @IsString()
  @IsNotEmpty()
  monumentBiographyEn: string;

  @IsString()
  @IsNotEmpty()
  lat: string;

  @IsString()
  @IsNotEmpty()
  lng: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  mDate: string;

  @IsInt()
  monumentsTypeId: number;

  @IsInt()
  eraId: number;

  @IsInt()
  dynastyId: number;

  @IsString()
  @IsNotEmpty()
  zoom: string;

  @IsString()
  @IsNotEmpty()
  center: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGalleryItemDto)
  @IsOptional()
  galleries?: CreateGalleryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDescriptionItemDto)
  @IsOptional()
  descriptions?: CreateDescriptionItemDto[];
}
