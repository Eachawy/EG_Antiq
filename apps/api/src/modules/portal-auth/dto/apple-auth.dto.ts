import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AppleUserName {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

class AppleUser {
  @IsString()
  @IsOptional()
  email?: string;

  @ValidateNested()
  @Type(() => AppleUserName)
  @IsOptional()
  name?: AppleUserName;
}

export class AppleAuthDto {
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ValidateNested()
  @Type(() => AppleUser)
  @IsOptional()
  user?: AppleUser;
}
