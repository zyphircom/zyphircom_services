import { DrizzleService } from "@/drizzle/drizzle.service";
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateTaskDto, EditTaskDto } from "./task.dto";
import { taskLogsTable, tasksTable } from "@/drizzle/drizzle.schema";
import { desc, eq } from "drizzle-orm";
import { Task, TaskLog } from "./task.types.js";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { LoggerService } from "@/logger/logger.service";

@Injectable()
export class TaskService {
  constructor(
    private drizzleService: DrizzleService,
    @InjectQueue("zyphir_queue") private readonly zyphir_queue: Queue,
    private logger: LoggerService,
  ) {}

  private async hasPermission(userId: number, taskId: number): Promise<void> {
    const task = await this.drizzleService
      .getClient()
      .select({ userId: tasksTable.userId })
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId));
    if (!task || task.length === 0) {
      throw new NotFoundException("Task not found.");
    }

    if (task[0].userId !== userId) {
      throw new ForbiddenException(
        "You do not have persmission to perform this action.",
      );
    }
  }

  async createTask(task: CreateTaskDto, userId: number): Promise<Task> {
    try {
      const job = await this.zyphir_queue.add(
        `task_${userId}_${Date.now()}`,
        task,
      );
      if (!job.id) {
        throw new InternalServerErrorException();
      }
      const newTask: Task[] = await this.drizzleService
        .getClient()
        .insert(tasksTable)
        .values({ ...task, userId: userId, jobId: job.id })
        .returning();
      return newTask[0];
    } catch (error) {
      await this.logger.error(
        `Failed to create task for user ${userId}`,
        error as Error,
        "TaskService",
        { userId, taskData: task },
      );
      throw new InternalServerErrorException();
    }
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    try {
      return await this.drizzleService
        .getClient()
        .select()
        .from(tasksTable)
        .where(eq(tasksTable.userId, userId))
        .orderBy(desc(tasksTable.createdAt));
    } catch (error) {
      await this.logger.error(
        `Failed to get tasks for user ${userId}`,
        error as Error,
        "TaskService",
        { userId },
      );
      throw new InternalServerErrorException();
    }
  }

  async editTask(
    userId: number,
    taskId: number,
    taskData: EditTaskDto,
  ): Promise<Task> {
    await this.hasPermission(userId, taskId);

    try {
      const updatedTask: Task[] = await this.drizzleService
        .getClient()
        .update(tasksTable)
        .set(taskData)
        .where(eq(tasksTable.id, taskId))
        .returning();
      return updatedTask[0];
    } catch (error) {
      await this.logger.error(
        `Failed to edit task ${taskId} for user ${userId}`,
        error as Error,
        "TaskService",
        { userId, taskId, taskData },
      );
      throw new InternalServerErrorException();
    }
  }

  async deleteTask(userId: number, taskId: number) {
    await this.hasPermission(userId, taskId);
    try {
      await this.drizzleService
        .getClient()
        .delete(tasksTable)
        .where(eq(tasksTable.id, taskId));
    } catch (error) {
      await this.logger.error(
        `Failed to delete task ${taskId} for user ${userId}`,
        error as Error,
        "TaskService",
        { userId, taskId },
      );
      throw new InternalServerErrorException();
    }
  }

  async getTaskLogs(userId: number, taskId: number): Promise<TaskLog[]> {
    await this.hasPermission(userId, taskId);
    try {
      const taskLogs: TaskLog[] = await this.drizzleService
        .getClient()
        .select()
        .from(taskLogsTable)
        .where(eq(taskLogsTable.taskId, taskId))
        .orderBy(desc(taskLogsTable.startedAt));
      return taskLogs;
    } catch (error) {
      await this.logger.error(
        `Failed to get task logs for task ${taskId}`,
        error as Error,
        "TaskService",
        { userId, taskId },
      );
      throw new InternalServerErrorException();
    }
  }
}
