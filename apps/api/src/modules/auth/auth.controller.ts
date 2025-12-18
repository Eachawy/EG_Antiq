import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<{ data: AuthResponse }> {
    const result = await this.authService.login(loginDto);
    return { data: result };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto
  ): Promise<{ data: { accessToken: string } }> {
    const result = await this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
    return { data: result };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ data: { message: string } }> {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { data: { message: 'Logged out successfully' } };
  }
}
