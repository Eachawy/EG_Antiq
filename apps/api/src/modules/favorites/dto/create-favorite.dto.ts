import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFavoriteDto {
  @ApiProperty({
    description: 'Monument ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  monumentId: number;

  @ApiProperty({
    description: 'Optional notes about this favorite',
    example: 'Want to visit this place next summer',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
