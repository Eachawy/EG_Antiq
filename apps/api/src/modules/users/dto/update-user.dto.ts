import { IsOptional, IsString, IsEmail, MaxLength, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({
    description: 'User status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'DEACTIVATED'])
  status?: string;

  @ApiProperty({
    description: 'User password (if changing)',
    example: 'NewPassword123!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password?: string;
}
