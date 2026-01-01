import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PortalAuthController } from './portal-auth.controller';
import { PortalAuthService } from './portal-auth.service';
import { PortalJwtStrategy } from './strategies/portal-jwt.strategy';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { FacebookOAuthStrategy } from './strategies/facebook-oauth.strategy';
import { AppleOAuthService } from './strategies/apple-oauth.strategy';
import { PrismaService } from '../../common/services/prisma.service';
import { config } from '../../config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'portal-jwt' }),
    JwtModule.register({
      secret: config.PORTAL_JWT_SECRET,
      signOptions: {
        expiresIn: config.PORTAL_JWT_ACCESS_TOKEN_TTL,
      },
    }),
  ],
  controllers: [PortalAuthController],
  providers: [
    PortalAuthService,
    PortalJwtStrategy,
    GoogleOAuthStrategy,
    FacebookOAuthStrategy,
    AppleOAuthService,
    PrismaService,
  ],
  exports: [PortalAuthService, PortalJwtStrategy],
})
export class PortalAuthModule {}
