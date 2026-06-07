import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

import { TaskModule } from "@api/task/task.module";
import { AuthModule } from "@api/auth/auth.module";
import { UsersModule } from "@api/users/users.module";
import { QueueModule } from "@api/queue/queue.module";

import { DrizzleModule } from "@lib/drizzle/drizzle.module";
import { EnvModule } from "@lib/env/env.module";
import envConfig from "@lib/config/env.config";
import { EnvService } from "@lib/env/env.service";
import { LoggerModule } from "@lib/logger/logger.module";

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
