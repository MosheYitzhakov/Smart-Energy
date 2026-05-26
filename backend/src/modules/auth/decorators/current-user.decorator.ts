import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../../users/user.entity';

export const CurrentUser = createParamDecorator(
  (key: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] => {
    const request = ctx.switchToHttp().getRequest<Request & { user: User }>();
    const user = request.user;
    return key ? user[key] : user;
  },
);
