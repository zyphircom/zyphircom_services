import { Module } from "@nestjs/common";
import { DrizzleModule } from "./drizzle/drizzle.module";
import { TaskModule } from "./task/task.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { BullModule } from "@nestjs/bullmq";
import { QueueModule } from "./queue/queue.module";
import { WorkerModule } from "./worker/worker.module";
import { EnvModule } from "./env/env.module";
import { ConfigModule } from "@nestjs/config";
import envConfig from "./config/env.config";
import { EnvService } from "./env/env.service";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ load: [envConfig] }),
    DrizzleModule,
    EnvModule,
    LoggerModule,
    QueueModule,
    TaskModule,
    UsersModule,
    WorkerModule,
    BullModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        connection: {
          host: envService.REDIS_HOST,
          port: Number(envService.REDIS_PORT),
        },
      }),
    }),
  ],
})
export class AppModule {}
