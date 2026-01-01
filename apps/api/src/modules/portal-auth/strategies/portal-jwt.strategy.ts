import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PortalAuthService } from '../portal-auth.service';
import { config } from '../../../config';

@Injectable()
export class PortalJwtStrategy extends PassportStrategy(Strategy, 'portal-jwt') {
  constructor(private portalAuthService: PortalAuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.PORTAL_JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Verify this is a portal token
    if (payload.type !== 'portal') {
      throw new UnauthorizedException('Invalid token type');
    }

    const portalUser = await this.portalAuthService.validatePortalUser(payload.sub);

    if (!portalUser) {
      throw new UnauthorizedException('Invalid token');
    }

    return portalUser;
  }
}
