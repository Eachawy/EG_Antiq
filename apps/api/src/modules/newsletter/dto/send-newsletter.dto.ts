import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendNewsletterDto {
  @ApiProperty({
    description: 'Email subject line',
    example: 'New Discoveries in Ancient Egypt',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject: string;

  @ApiProperty({
    description: 'Plain text content (fallback)',
    example: 'Check out our latest discoveries...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'HTML content for email',
    example: '<html><body>...</body></html>',
  })
  @IsString()
  @IsNotEmpty()
  htmlContent: string;
}
