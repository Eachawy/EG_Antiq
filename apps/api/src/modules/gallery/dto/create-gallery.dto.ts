import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  @IsNotEmpty()
  galleryPath: string;

  @IsInt()
  dynastyId: number;

  @IsInt()
  eraId: number;

  @IsInt()
  monumentsTypeId: number;

  @IsInt()
  monumentsId: number;
}
