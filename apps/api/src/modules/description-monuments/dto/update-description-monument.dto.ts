import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateDescriptionMonumentDto {
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

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
