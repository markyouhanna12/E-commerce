import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { HUserDocument } from 'src/DB/Models/user.model';

export const CurrentUser = createParamDecorator(
  (data: keyof HUserDocument | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user: HUserDocument = request.user;

    return data ? user?.[data] : user;
  },
);
