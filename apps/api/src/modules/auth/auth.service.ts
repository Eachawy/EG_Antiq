import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/services/prisma.service';
import { AppError } from '../../common/errors/base.error';
import { config } from '../../config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, RefreshResponse } from './dto/auth-response.dto';
import { logger } from '../../logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('USER_EXISTS', 'User with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id);

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user with roles
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('USER_INACTIVE', 'User account is inactive', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    // Extract role names
    const roles = user.userRoles.map((ur) => ur.role.name);

    // Generate tokens (including roles in JWT)
    const accessToken = this.generateAccessToken(user.id, user.email, roles);
    const refreshToken = await this.generateRefreshToken(user.id);

    logger.info('User logged in successfully', { userId: user.id, email: user.email, roles });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
    // Verify refresh token
    try {
      this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new AppError('INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    // Check if refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new AppError('TOKEN_REVOKED', 'Refresh token has been revoked', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AppError('TOKEN_EXPIRED', 'Refresh token has expired', 401);
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(
      storedToken.user.id,
      storedToken.user.email
    );

    return { accessToken };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });

    logger.info('User logged out');
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(userId: string, email: string, roles: string[] = []): string {
    const payload = {
      sub: userId,
      email,
      roles,
    };

    return this.jwtService.sign(payload, {
      expiresIn: config.JWT_ACCESS_TOKEN_TTL,
    });
  }

  /**
   * Generate refresh token and store in database
   */
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: config.JWT_REFRESH_TOKEN_TTL }
    );

    // Calculate expiration date (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }
}
