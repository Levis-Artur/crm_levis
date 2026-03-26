import { UnauthorizedException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { PresentedUser } from '../../users/presenters/user.presenter';

export const CurrentUser = createParamDecorator(
  (data: keyof PresentedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: PresentedUser }>();

    if (!request.user) {
      throw new UnauthorizedException('Authenticated user was not resolved.');
    }

    return data ? request.user[data] : request.user;
  },
);
