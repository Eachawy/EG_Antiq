import { Injectable } from '@nestjs/common';
import appleSignin from 'apple-signin-auth';
import { config } from '../../../config';

export interface AppleAuthData {
  identityToken: string;
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

@Injectable()
export class AppleOAuthService {
  /**
   * Verify Apple identity token and extract user data
   * Apple Sign In is different from Google/Facebook OAuth - the client sends
   * an identity token that we verify on the backend
   */
  async verifyToken(authData: AppleAuthData) {
    try {
      // Verify the identity token with Apple's public keys
      const appleData = await appleSignin.verifyIdToken(authData.identityToken, {
        audience: config.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });

      // Extract user info
      // Note: Apple only provides user details on first sign-in
      // Subsequent sign-ins only provide the subject (user ID)
      const providerId = appleData.sub;
      const email = appleData.email || authData.user?.email;
      const firstName = authData.user?.name?.firstName || '';
      const lastName = authData.user?.name?.lastName || '';

      if (!email) {
        throw new Error('Email is required from Apple Sign In');
      }

      return {
        providerId,
        provider: 'APPLE' as const,
        email,
        firstName,
        lastName,
        emailVerified: appleData.email_verified === 'true',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Apple Sign In verification failed: ${errorMessage}`);
    }
  }
}
