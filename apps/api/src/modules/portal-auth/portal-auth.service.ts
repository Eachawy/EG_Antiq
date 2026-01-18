import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { config } from '../../config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestResetPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { logger } from '../../logger';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
  };
}

export interface RefreshResponse {
  accessToken: string;
}

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new portal user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.portalUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create portal user
    const portalUser = await this.prisma.portalUser.create({
      data: {
        id: crypto.randomUUID(),
        email,
        passwordHash,
        firstName,
        lastName,
        status: 'ACTIVE',
        emailVerified: false,
      },
    });

    // Create default user settings
    await this.prisma.userSettings.create({
      data: {
        id: crypto.randomUUID(),
        portalUserId: portalUser.id,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(portalUser.id, portalUser.email);
    const refreshToken = await this.generateRefreshToken(portalUser.id);

    logger.info('Portal user registered successfully', {
      userId: portalUser.id,
      email: portalUser.email,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: portalUser.id,
        email: portalUser.email,
        firstName: portalUser.firstName,
        lastName: portalUser.lastName,
        emailVerified: portalUser.emailVerified,
      },
    };
  }

  /**
   * Login portal user
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find portal user
    const portalUser = await this.prisma.portalUser.findUnique({
      where: { email },
    });

    if (!portalUser || portalUser.deletedAt) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Check if user is active
    if (portalUser.status !== 'ACTIVE') {
      throw new AppError('USER_INACTIVE', 'User account is not active', 403);
    }

    // Check if user has a password (might be OAuth only)
    if (!portalUser.passwordHash) {
      throw new AppError(
        'NO_PASSWORD',
        'This account uses social login. Please sign in with Google, Facebook, or Apple.',
        400,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, portalUser.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Update last login
    await this.prisma.portalUser.update({
      where: { id: portalUser.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(portalUser.id, portalUser.email);
    const refreshToken = await this.generateRefreshToken(portalUser.id);

    logger.info('Portal user logged in successfully', {
      userId: portalUser.id,
      email: portalUser.email,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: portalUser.id,
        email: portalUser.email,
        firstName: portalUser.firstName,
        lastName: portalUser.lastName,
        emailVerified: portalUser.emailVerified,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    // Find refresh token in database
    const tokenRecord = await this.prisma.portalRefreshToken.findUnique({
      where: { token: refreshToken },
      include: { portalUser: true },
    });

    if (!tokenRecord) {
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    if (tokenRecord.isRevoked) {
      throw new AppError('TOKEN_REVOKED', 'Refresh token has been revoked', 401);
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new AppError('TOKEN_EXPIRED', 'Refresh token has expired', 401);
    }

    if (tokenRecord.portalUser.deletedAt || tokenRecord.portalUser.status !== 'ACTIVE') {
      throw new AppError('USER_INACTIVE', 'User account is not active', 403);
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(
      tokenRecord.portalUser.id,
      tokenRecord.portalUser.email,
    );

    return { accessToken };
  }

  /**
   * Logout - revoke refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.portalRefreshToken.updateMany({
      where: { token: refreshToken },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info('Portal user logged out', { refreshToken });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(dto: RequestResetPasswordDto): Promise<void> {
    const { email } = dto;

    const portalUser = await this.prisma.portalUser.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!portalUser || portalUser.deletedAt) {
      logger.info('Password reset requested for non-existent email', { email });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.portalUser.update({
      where: { id: portalUser.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpiry,
      },
    });

    // TODO: Send reset password email
    logger.info('Password reset token generated', {
      userId: portalUser.id,
      email: portalUser.email,
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = dto;

    const portalUser = await this.prisma.portalUser.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!portalUser) {
      throw new AppError('INVALID_TOKEN', 'Invalid or expired reset token', 400);
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.prisma.portalUser.update({
      where: { id: portalUser.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Revoke all existing refresh tokens
    await this.prisma.portalRefreshToken.updateMany({
      where: { portalUserId: portalUser.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    logger.info('Password reset successfully', { userId: portalUser.id });
  }

  /**
   * Validate portal user (used by JWT strategy)
   */
  async validatePortalUser(userId: string) {
    logger.info('Validating portal user', { userId });

    const portalUser = await this.prisma.portalUser.findUnique({
      where: { id: userId },
    });

    logger.info('Portal user found', {
      found: !!portalUser,
      deletedAt: portalUser?.deletedAt,
      status: portalUser?.status
    });

    if (!portalUser) {
      logger.warn('Portal user not found', { userId });
      return null;
    }

    if (portalUser.deletedAt) {
      logger.warn('Portal user is deleted', { userId });
      return null;
    }

    if (portalUser.status !== 'ACTIVE') {
      logger.warn('Portal user is not active', { userId, status: portalUser.status });
      return null;
    }

    logger.info('Portal user validated successfully', { userId, email: portalUser.email });
    return portalUser;
  }

  /**
   * Generate access token (JWT)
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: 'portal', // Distinguish from admin tokens
    };

    return this.jwtService.sign(payload, {
      secret: config.PORTAL_JWT_SECRET,
      expiresIn: config.PORTAL_JWT_ACCESS_TOKEN_TTL,
    });
  }

  /**
   * Generate refresh token and store in database
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.portalRefreshToken.create({
      data: {
        id: crypto.randomUUID(),
        portalUserId: userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Handle OAuth login (Google, Facebook, Apple)
   * Creates new user if doesn't exist, or links OAuth provider to existing user
   */
  async handleOAuthLogin(oauthData: {
    providerId: string;
    provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    accessToken?: string;
    refreshToken?: string;
    emailVerified?: boolean;
  }): Promise<AuthResponse> {
    const { providerId, provider, email, firstName, lastName, avatar, accessToken, refreshToken, emailVerified } = oauthData;

    // Check if OAuth provider connection already exists
    const existingOAuthProvider = await this.prisma.oAuthProvider.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: {
        portalUser: true,
      },
    });

    let portalUser;

    if (existingOAuthProvider) {
      // User has logged in with this provider before
      portalUser = existingOAuthProvider.portalUser;

      if (portalUser.deletedAt) {
        throw new AppError('USER_DELETED', 'This account has been deleted', 403);
      }

      if (portalUser.status !== 'ACTIVE') {
        throw new AppError('USER_INACTIVE', 'User account is not active', 403);
      }

      // Update OAuth provider tokens
      await this.prisma.oAuthProvider.update({
        where: { id: existingOAuthProvider.id },
        data: {
          accessToken,
          refreshToken,
          expiresAt: null, // Can be calculated based on provider's token expiry
          updatedAt: new Date(),
        },
      });
    } else {
      // Check if user exists with this email
      const existingUser = await this.prisma.portalUser.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Link OAuth provider to existing user
        portalUser = existingUser;

        if (portalUser.deletedAt) {
          throw new AppError('USER_DELETED', 'This account has been deleted', 403);
        }

        if (portalUser.status !== 'ACTIVE') {
          throw new AppError('USER_INACTIVE', 'User account is not active', 403);
        }

        // Create OAuth provider link
        await this.prisma.oAuthProvider.create({
          data: {
            id: crypto.randomUUID(),
            portalUserId: portalUser.id,
            provider,
            providerId,
            accessToken,
            refreshToken,
          },
        });

        logger.info('OAuth provider linked to existing user', {
          userId: portalUser.id,
          provider,
        });
      } else {
        // Create new user with OAuth provider
        portalUser = await this.prisma.portalUser.create({
          data: {
            id: crypto.randomUUID(),
            email,
            passwordHash: null, // OAuth users don't have passwords
            firstName: firstName || 'User',
            lastName: lastName || '',
            avatar,
            status: 'ACTIVE',
            emailVerified: emailVerified ?? true, // Most OAuth providers verify emails
            oauthProviders: {
              create: {
                id: crypto.randomUUID(),
                provider,
                providerId,
                accessToken,
                refreshToken,
              },
            },
          },
        });

        // Create default user settings
        await this.prisma.userSettings.create({
          data: {
            id: crypto.randomUUID(),
            portalUserId: portalUser.id,
          },
        });

        logger.info('New portal user created via OAuth', {
          userId: portalUser.id,
          provider,
          email: portalUser.email,
        });
      }
    }

    // Update last login
    await this.prisma.portalUser.update({
      where: { id: portalUser.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const jwtAccessToken = this.generateAccessToken(portalUser.id, portalUser.email);
    const jwtRefreshToken = await this.generateRefreshToken(portalUser.id);

    logger.info('Portal user logged in via OAuth', {
      userId: portalUser.id,
      provider,
    });

    return {
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
      user: {
        id: portalUser.id,
        email: portalUser.email,
        firstName: portalUser.firstName,
        lastName: portalUser.lastName,
        emailVerified: portalUser.emailVerified,
      },
    };
  }
}
