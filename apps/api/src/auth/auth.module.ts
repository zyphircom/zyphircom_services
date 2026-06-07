import { Module } from "@nestjs/common";
import { AuthService } from "@api/auth/auth.service";
import { AuthController } from "@api/auth/auth.controller";
import { UsersModule } from "@api/users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { EnvService } from "@lib/env/env.service";
import { EnvModule } from "@lib/env/env.module";
import { LoggerModule } from "@lib/logger/logger.module";
import { DrizzleModule } from "@lib/drizzle/drizzle.module";

@Module({
  imports: [
    EnvModule,
    UsersModule,
    LoggerModule,
    DrizzleModule,
    JwtModule.registerAsync({
      global: true,
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.JWT_SECRET,
        signOptions: { expiresIn: "4h", algorithm: "HS256" },
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
