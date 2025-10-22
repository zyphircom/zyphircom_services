import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignInDto, SignUpDto } from "./auth.dto";

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
