import { usersTable } from "@/drizzle/drizzle.schema";
import { DrizzleService } from "@/drizzle/drizzle.service";
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import { eq } from "drizzle-orm";
import { User } from "./users.types";
import { LoggerService } from "@/logger/logger.service";

@Injectable()
export class UsersService {
  constructor(
    private drizzleService: DrizzleService,
    private logger: LoggerService,
  ) {}

  private async findUser(email?: string, id?: string): Promise<User> {
    if (!email && !id) {
      throw new BadRequestException("Email or ID must be provided");
    }

    let result: User[];

    if (email) {
      result = await this.drizzleService
        .getClient()
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
    } else if (id) {
      result = await this.drizzleService
        .getClient()
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id));
    } else {
      result = [];
    }

    if (!result || result.length === 0) {
      throw new NotFoundException("User not found");
    }

    return result[0];
  }

  async findUserByEmail(email: string) {
    return this.findUser(email);
  }

  async findUserById(id: string) {
    return this.findUser("", id);
  }

  async createUser(email: string, password: string) {
    try {
      const newUser = await this.drizzleService
        .getClient()
        .insert(usersTable)
        .values({ email: email, password: password })
        .returning({ id: usersTable.id, email: usersTable.email });
      if (!newUser || newUser.length === 0) {
        throw new NotFoundException();
      }
      return newUser[0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      await this.logger.error(
        "Could not create new user",
        error as Error,
        "UserService",
        { email },
      );
      throw new InternalServerErrorException("Could not create new user.");
    }
  }
}
