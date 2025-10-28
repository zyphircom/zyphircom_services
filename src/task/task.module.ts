import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { DrizzleModule } from "@/drizzle/drizzle.module";
import { QueueModule } from "@/queue/queue.module";
import { EnvModule } from "@/env/env.module";
import { LoggerModule } from "@/logger/logger.module";

@Module({
  imports: [DrizzleModule, QueueModule, EnvModule, LoggerModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
