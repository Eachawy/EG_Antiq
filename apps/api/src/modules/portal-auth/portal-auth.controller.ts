import { Body, Controller, Post, HttpCode, HttpStatus, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { PortalAuthService } from './portal-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  RequestResetPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/reset-password.dto';
import { AppleAuthDto } from './dto/apple-auth.dto';
import { AppleOAuthService } from './strategies/apple-oauth.strategy';
import { config } from '../../config';

@ApiTags('Portal Auth')
@Controller('portal/auth')
@Public() // All portal auth routes are public
export class PortalAuthController {
  constructor(
    private readonly portalAuthService: PortalAuthService,
    private readonly appleOAuthService: AppleOAuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new portal user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.portalAuthService.register(registerDto);
    return {
      data: result,
      message: 'User registered successfully',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login portal user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.portalAuthService.login(loginDto);
    return {
      data: result,
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.portalAuthService.refreshToken(refreshTokenDto.refreshToken);
    return {
      data: result,
      message: 'Token refreshed successfully',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout portal user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.portalAuthService.logout(refreshTokenDto.refreshToken);
    return {
      message: 'Logout successful',
    };
  }

  @Post('request-reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if user exists' })
  async requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    await this.portalAuthService.requestPasswordReset(dto);
    return {
      message: 'If an account with that email exists, a password reset link has been sent',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.portalAuthService.resetPassword(dto);
    return {
      message: 'Password reset successfully',
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() _dto: VerifyEmailDto) {
    // TODO: Implement email verification
    return {
      message: 'Email verified successfully',
    };
  }

  // ========== OAuth Endpoints ==========

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleLogin() {
    // Guard redirects to Google OAuth
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as any;
    const result = await this.portalAuthService.handleOAuthLogin(oauthUser);

    // Redirect to frontend callback page with tokens in URL
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3002';
    const callbackUrl = `${frontendUrl}/auth/callback?access_token=${encodeURIComponent(result.accessToken)}&refresh_token=${encodeURIComponent(result.refreshToken)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

    res.redirect(callbackUrl);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook OAuth' })
  async facebookLogin() {
    // Guard redirects to Facebook OAuth
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as any;
    const result = await this.portalAuthService.handleOAuthLogin(oauthUser);

    // Redirect to frontend callback page with tokens in URL
    const frontendUrl = config.FRONTEND_URL || 'http://localhost:3002';
    const callbackUrl = `${frontendUrl}/auth/callback?access_token=${encodeURIComponent(result.accessToken)}&refresh_token=${encodeURIComponent(result.refreshToken)}&user=${encodeURIComponent(JSON.stringify(result.user))}`;

    res.redirect(callbackUrl);
  }

  @Post('apple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apple Sign In authentication' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 400, description: 'Invalid Apple token' })
  async appleLogin(@Body() appleAuthDto: AppleAuthDto) {
    // Verify Apple identity token
    const appleUser = await this.appleOAuthService.verifyToken(appleAuthDto);

    // Handle OAuth login
    const result = await this.portalAuthService.handleOAuthLogin(appleUser);

    return {
      data: result,
      message: 'Login successful',
    };
  }
}
