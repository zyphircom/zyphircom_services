import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { DrizzleModule } from "@/drizzle/drizzle.module";
import { LoggerModule } from "@/logger/logger.module";

@Module({
  imports: [DrizzleModule, LoggerModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
