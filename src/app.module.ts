import { Module } from "@nestjs/common";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { TaskModule } from "./task/task.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { BullModule } from "@nestjs/bullmq";
import { env } from "./env";
import { appConstants } from "./constants";

@Module({
  imports: [
    DrizzleModule,
    TaskModule,
    AuthModule,
    UsersModule,
    BullModule.forRoot({
      connection: { host: env.REDIS_HOST, port: Number(env.REDIS_PORT) },
    }),
    BullModule.registerQueue({ name: appConstants.QUEUE_NAME }),
  ],
})
export class AppModule {}
