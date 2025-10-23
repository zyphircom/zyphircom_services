import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { DrizzleModule } from "@/drizzle/drizzle.module";
import { QueueModule } from "@/queue/queue.module";

@Module({
  imports: [DrizzleModule, QueueModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
