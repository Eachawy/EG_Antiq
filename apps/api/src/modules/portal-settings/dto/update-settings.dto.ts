import { IsBoolean, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({
    description: 'Enable dark mode',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @ApiProperty({
    description: 'Preferred language',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({
    description: 'Enable email notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({
    description: 'Enable push notifications',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiProperty({
    description: 'Enable newsletter subscription',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  newsletterEnabled?: boolean;

  @ApiProperty({
    description: 'Receive site updates notifications',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  siteUpdates?: boolean;

  @ApiProperty({
    description: 'Show browsing history',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  showBrowsingHistory?: boolean;

  @ApiProperty({
    description: 'Auto-save searches',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  autoSaveSearches?: boolean;

  @ApiProperty({
    description: 'Additional settings as JSON object',
    example: { theme: 'blue' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  additionalSettings?: Record<string, any>;
}
