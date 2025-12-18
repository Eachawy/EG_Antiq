import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateGalleryDto {
  @IsString()
  @IsOptional()
  galleryPath?: string;

  @IsInt()
  @IsOptional()
  dynastyId?: number;

  @IsInt()
  @IsOptional()
  eraId?: number;

  @IsInt()
  @IsOptional()
  monumentsTypeId?: number;

  @IsInt()
  @IsOptional()
  monumentsId?: number;
}
