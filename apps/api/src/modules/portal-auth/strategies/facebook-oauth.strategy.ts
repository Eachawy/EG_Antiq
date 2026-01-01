import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { config } from '../../../config';

@Injectable()
export class FacebookOAuthStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: config.FACEBOOK_APP_ID || 'placeholder',
      clientSecret: config.FACEBOOK_APP_SECRET || 'placeholder',
      callbackURL: `${config.API_URL}/api/v1/portal/auth/facebook/callback`,
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const user = {
      providerId: id,
      provider: 'FACEBOOK',
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatar: photos?.[0]?.value,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
