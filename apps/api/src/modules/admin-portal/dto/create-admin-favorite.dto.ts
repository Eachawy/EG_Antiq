import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateAdminFavoriteDto {
  @ApiProperty({
    description: 'Portal user ID',
    example: 'uuid-here',
  })
  @IsNotEmpty()
  @IsString()
  portalUserId: string;

  @ApiProperty({
    description: 'Monument ID',
    example: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  monumentId: number;

  @ApiProperty({
    description: 'Optional notes about the favorite',
    example: 'Beautiful monument',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
