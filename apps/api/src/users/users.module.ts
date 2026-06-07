import { Module } from "@nestjs/common";
import { UsersService } from "@api/users/users.service";
import { DrizzleModule } from "@lib/drizzle/drizzle.module";
import { LoggerModule } from "@lib/logger/logger.module";

@Module({
  imports: [DrizzleModule, LoggerModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
