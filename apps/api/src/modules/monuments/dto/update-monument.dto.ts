import { IsString, IsOptional, IsInt } from 'class-validator';

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
  mDate?: string;

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
}
