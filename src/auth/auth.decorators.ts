import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "./auth.types";

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
