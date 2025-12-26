import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OAuthGoogleDto {
  @ApiProperty({
    description: 'Google ID token from OAuth',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class OAuthFacebookDto {
  @ApiProperty({
    description: 'Facebook access token from OAuth',
    example: 'EAABwzLixnjYBAO...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class OAuthAppleDto {
  @ApiProperty({
    description: 'Apple authorization code',
    example: 'c3d2e1f0g9h8...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Apple ID token',
    example: 'eyJraWQiOiJlWGF1bm1MIiwiYWxnIjoiUlMyNTYifQ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
