import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateDescriptionMonumentDto {
  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @IsString()
  @IsNotEmpty()
  descriptionEn: string;

  @IsInt()
  eraId: number;

  @IsInt()
  monumentsTypeId: number;

  @IsInt()
  dynastyId: number;
}
