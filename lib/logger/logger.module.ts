import { Module } from "@nestjs/common";
import { LoggerService } from "@lib/logger/logger.service";
import { DrizzleModule } from "@lib/drizzle/drizzle.module";
import { EnvModule } from "@lib/env/env.module";

@Module({
  imports: [DrizzleModule, EnvModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
