import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { UsersModule } from "@/users/users.module";
import { JwtModule } from "@nestjs/jwt";
import { env } from "@/env";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: env.JWT_SECRET,
      signOptions: { expiresIn: "1h", algorithm: "HS256" },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
