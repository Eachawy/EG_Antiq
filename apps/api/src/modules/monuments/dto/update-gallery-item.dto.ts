import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateGalleryItemDto {
  @IsInt()
  @IsOptional()
  id?: number;

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
}
