import { Module } from "@nestjs/common";
import { TaskService } from "@api/task/task.service";
import { TaskController } from "@api/task/task.controller";
import { DrizzleModule } from "@lib/drizzle/drizzle.module";
import { QueueModule } from "@api/queue/queue.module";
import { EnvModule } from "@lib/env/env.module";
import { LoggerModule } from "@lib/logger/logger.module";

@Module({
  imports: [DrizzleModule, QueueModule, EnvModule, LoggerModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
