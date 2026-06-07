import {
  CanActivate,
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthenticatedRequest, JwtPayload } from "@api/auth/auth.types";
import { EnvService } from "@lib/env/env.service";
import { DrizzleService } from "@lib/drizzle/drizzle.service";
import { usersTable } from "@lib/drizzle/drizzle.schema";
import { eq } from "drizzle-orm";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private envService: EnvService,
    private drizzleService: DrizzleService,
  ) {}

  private async doesUserExist(userId: string) {
    const db = this.drizzleService.getClient();
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (user.length != 1) {
      throw new UnauthorizedException();
    }
  }

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
          secret: this.envService.JWT_SECRET,
        },
      );

      await this.doesUserExist(tokenPayload.sub);

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
