import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Patch,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@/auth/auth.guard";
import { User } from "@/auth/auth.decorators";
import { TaskService } from "./task.service";
import { CreateTaskDto, EditTaskDto } from "./task.dto";
import { LoggerService } from "@/logger/logger.service";
import { AlreadyLoggedError } from "@/logger/already-logged.error";
import { Request } from "express";

@UseGuards(AuthGuard)
@Controller("task")
export class TaskController {
  constructor(
    private taskService: TaskService,
    private logger: LoggerService,
  ) {}

  @Post()
  async createTask(
    @Body() CreateTaskDto: CreateTaskDto,
    @User() user: { userId: string; email: string },
    @Req() request: Request,
  ) {
    try {
      const task = await this.taskService.createTask(
        CreateTaskDto,
        Number(user.userId),
      );
      return {
        success: true,
        message: "Task created successfully",
        data: task,
      };
    } catch (error) {
      await this.logger.error(
        `Failed to create task for user ${user.userId}`,
        error as Error,
        "TaskService",
        { taskData: CreateTaskDto },
        Number(user.userId),
        request.url,
        request.method,
      );
      throw new AlreadyLoggedError("Failed to create new task", {
        cause: error as Error,
      });
    }
  }

  @Get()
  async getTasksByUserId(
    @User() user: { userId: string; email: string },
    @Req() request: Request,
  ) {
    try {
      const tasks = await this.taskService.getTasksByUserId(
        Number(user.userId),
      );
      return {
        success: true,
        message: "Tasks retrieved successfully",
        data: tasks,
      };
    } catch (error) {
      await this.logger.error(
        `Failed to get tasks for user ${user.userId}`,
        error as Error,
        "TaskService",
        undefined,
        Number(user.userId),
        request.url,
        request.method,
      );
      throw new AlreadyLoggedError("Failed to get tasks", {
        cause: error as Error,
      });
    }
  }

  @Patch(":id")
  async editTask(
    @Body() taskData: EditTaskDto,
    @Param("id") taskId: string,
    @User() user: { userId: string; email: string },
    @Req() request: Request,
  ) {
    try {
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
    } catch (error) {
      await this.logger.error(
        `Failed to edit task ${taskId} for user ${user.userId}`,
        error as Error,
        "TaskService",
        { taskId, taskData },
        Number(user.userId),
        request.url,
        request.method,
      );
    }
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
