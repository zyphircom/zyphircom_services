import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "@lib/config/validation";

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get APP_NAME(): string {
    return this.configService.get("APP_NAME", { infer: true });
  }
  get DATABASE_URL(): string {
    return this.configService.get("DATABASE_URL", { infer: true });
  }

  get NODE_ENV(): string {
    return this.configService.get("NODE_ENV", { infer: true });
  }

  get JWT_SECRET(): string {
    return this.configService.get("JWT_SECRET", { infer: true });
  }

  get REDIS_HOST(): string {
    return this.configService.get("REDIS_HOST", { infer: true });
  }

  get REDIS_PORT(): number {
    return Number(this.configService.get("REDIS_PORT", { infer: true }));
  }

  get LOG_LEVEL(): string {
    return this.configService.get("LOG_LEVEL", { infer: true });
  }

  get LOG_WARNINGS_TO_DB(): string {
    return this.configService.get("LOG_WARNINGS_TO_DB", { infer: true });
  }
}
