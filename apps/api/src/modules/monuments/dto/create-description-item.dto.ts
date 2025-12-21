import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateDescriptionItemDto {
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @IsInt()
  @IsOptional()
  eraId?: number;

  @IsInt()
  @IsOptional()
  monumentsTypeId?: number;

  @IsInt()
  @IsOptional()
  dynastyId?: number;
}
