import { env } from "@/env";
import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthenticatedRequest, JwtPayload } from "./auth.types";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const tokenPayload = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        {
          secret: env.JWT_SECRET,
        },
      );

      request.user = {
        userId: tokenPayload.sub,
        email: tokenPayload.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
