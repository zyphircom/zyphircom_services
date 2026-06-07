import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "@api/users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { LoggerService } from "@lib/logger/logger.service";

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException("User not found!");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials!");
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await this.userService.findUserByEmail(email);
      if (user) {
        throw new ConflictException();
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        return await this.userService.createUser(email, hashedPassword);
      } else if (error instanceof ConflictException) {
        throw new ConflictException("Email already exists!");
      }

      await this.logger.error(
        `Failed to sign up user with email: ${email}`,
        error as Error,
        "AuthService",
        { email },
      );
      throw new InternalServerErrorException();
    }
  }
}
