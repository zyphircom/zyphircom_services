import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "@/users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { EnvService } from "@/env/env.service";
import { EnvModule } from "@/env/env.module";

@Module({
  imports: [
    EnvModule,
    UsersModule,
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
