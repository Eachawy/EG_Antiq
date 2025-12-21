import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateGalleryItemDto {
  @IsString()
  @IsNotEmpty()
  galleryPath: string;

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
