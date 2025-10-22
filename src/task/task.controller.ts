import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Patch,
  Param,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { User } from "@/auth/auth.decorators";
import { TaskService } from "./task.service";
import { CreateTaskDto, EditTaskDto } from "./task.dto";

@UseGuards(AuthGuard)
@Controller("task")
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  async createTask(
    @Body() CreateTaskDto: CreateTaskDto,
    @User() user: { userId: string; email: string },
  ) {
    const task = await this.taskService.createTask(
      CreateTaskDto,
      Number(user.userId),
    );
    return {
      success: true,
      message: "Task created successfully",
      data: task,
    };
  }

  @Get()
  async getTasksByUserId(@User() user: { userId: string; email: string }) {
    const tasks = await this.taskService.getTasksByUserId(Number(user.userId));
    return {
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    };
  }

  @Patch(":id")
  async editTask(
    @Body() taskData: EditTaskDto,
    @Param("id") taskId: string,
    @User() user: { userId: string; email: string },
  ) {
    const updatedTask = await this.taskService.editTask(
      Number(user.userId),
      Number(taskId),
      taskData,
    );
    return {
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    };
  }

  @Delete(":id")
  async deleteTask(
    @Param("id") taskId: string,
    @User() user: { userId: string; email: string },
  ) {
    await this.taskService.deleteTask(Number(user.userId), Number(taskId));
    return {
      success: true,
      message: "Task deleted successfully",
    };
  }

  @Get(":id/logs")
  async getTaskLogs(
    @Param("id") taskId: string,
    @User() user: { userId: string; email: string },
  ) {
    const taskLogs = await this.taskService.getTaskLogs(
      Number(user.userId),
      Number(taskId),
    );
    return {
      success: true,
      message: "Logs retrieved successfully",
      data: taskLogs,
    };
  }
}
