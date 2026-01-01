import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedPortalUser {
  sub: string; // Portal user ID (UUID)
  email: string;
  type: 'portal';
}

export const CurrentPortalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedPortalUser;
  },
);
