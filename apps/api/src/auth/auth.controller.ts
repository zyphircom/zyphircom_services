import { Controller, Post, Body } from "@nestjs/common";
import { SignInDto, SignUpDto } from "@api/auth/auth.dto";
import { AuthService } from "@api/auth/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  async signIn(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post("signup")
  async signUp(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto.email, signUpDto.password);
  }
}
