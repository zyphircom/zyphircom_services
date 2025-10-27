import { Module } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { DrizzleModule } from "@/drizzle/drizzle.module";
import { EnvModule } from "@/env/env.module";

@Module({
  imports: [DrizzleModule, EnvModule],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
