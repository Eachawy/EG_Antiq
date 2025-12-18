import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/services/prisma.service';
import { UnauthorizedError, BusinessError } from '@packages/common';
import { config } from '../../config';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from './dto/auth-response.dto';
import { logger } from '@packages/logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Authenticate user and generate tokens
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      logger.warn('Login attempt with invalid email', { email });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      logger.warn('Login attempt with inactive account', { email, status: user.status });
      throw new BusinessError('ACCOUNT_SUSPENDED', 'Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check email verification
    if (!user.emailVerified) {
      logger.warn('Login attempt with unverified email', { email });
      throw new BusinessError('EMAIL_NOT_VERIFIED', 'Email not verified');
    }

    // Generate tokens
    const roles = user.roles.map((ur) => ur.role.name);
    const accessToken = await this.generateAccessToken(user.id, user.email, user.organizationId, roles);
    const refreshToken = await this.generateRefreshToken(user.id);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId,
      },
    };
  }

  /**
   * Generate JWT access token
   */
  private async generateAccessToken(
    userId: string,
    email: string,
    organizationId: string,
    roles: string[]
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      organizationId,
      roles,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate refresh token and store in database
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: config.JWT_REFRESH_TOKEN_TTL }
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    try {
      this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedError('Refresh token revoked or invalid');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Generate new access token
    const user = storedToken.user;
    const roles = user.roles.map((ur) => ur.role.name);
    const accessToken = await this.generateAccessToken(
      user.id,
      user.email,
      user.organizationId,
      roles
    );

    return { accessToken };
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });

    logger.info('User logged out', { refreshToken: refreshToken.substring(0, 10) });
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles: user.roles.map((ur) => ur.role.name),
    };
  }
}
