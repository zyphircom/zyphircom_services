import { Module } from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskController } from "./task.controller";
import { DrizzleModule } from "@/drizzle/drizzle.module";

@Module({
  imports: [DrizzleModule],
  providers: [TaskService],
  controllers: [TaskController],
})
export class TaskModule {}
