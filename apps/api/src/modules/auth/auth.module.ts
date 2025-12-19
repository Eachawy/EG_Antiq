import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaService } from '../../common/services/prisma.service';
import { config } from '../../config';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: config.JWT_SECRET,
      signOptions: { expiresIn: config.JWT_ACCESS_TOKEN_TTL },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
