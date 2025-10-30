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
    const db = this.drizzleService.getClient();

    try {
      const task = await db
        .select({ userId: tasksTable.userId })
        .from(tasksTable)
        .where(eq(tasksTable.id, taskId));

      if (!task || task.length === 0) {
        throw new NotFoundException("Task not found.");
      }

      if (task[0].userId !== userId) {
        throw new ForbiddenException(
          "You do not have permission to perform this action.",
        );
      }
    } catch (error) {
      if (
        !(
          error instanceof NotFoundException ||
          error instanceof ForbiddenException
        )
      ) {
        await this.logger.error(
          "Permission check failed",
          error as Error,
          "TaskService",
          { taskId },
          userId,
        );
      }
      throw error;
    }
  }

  private async existingTask(taskId: number) {
    const db = this.drizzleService.getClient();

    const task = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId));

    if (!task[0]) {
      throw new NotFoundException("Task not found");
    }

    return task[0];
  }

  async createTask(task: CreateTaskDto, userId: number): Promise<Task> {
    const db = this.drizzleService.getClient();

    const job = await this.zyphir_queue.add(
      `task_${userId}_${Date.now()}`,
      task,
      {
        repeat: { pattern: task.cron },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    if (!job.id) {
      throw new InternalServerErrorException();
    }
    const newTask: Task[] = await db
      .insert(tasksTable)
      .values({ ...task, userId: userId, jobId: job.id })
      .returning();

    return newTask[0];
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    const db = this.drizzleService.getClient();

    return await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId))
      .orderBy(desc(tasksTable.createdAt));
  }

  async editTask(
    userId: number,
    taskId: number,
    taskData: EditTaskDto,
  ): Promise<Task> {
    await this.hasPermission(userId, taskId);

    const existingTask = await this.existingTask(taskId);

    if (existingTask.jobId) {
      const oldJob = await this.zyphir_queue.getJob(existingTask.jobId);
      if (oldJob) {
        await oldJob.remove();
      }
    }

    const newJob = await this.zyphir_queue.add(
      `task_${userId}_${Date.now()}`,
      {
        ...existingTask,
        ...taskData,
      },
      {
        repeat: { pattern: taskData.cron },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    if (!newJob.id) {
      throw new InternalServerErrorException();
    }
    const db = this.drizzleService.getClient();

    const updatedTask: Task[] = await db
      .update(tasksTable)
      .set({ ...taskData, jobId: newJob.id })
      .where(eq(tasksTable.id, taskId))
      .returning();

    return updatedTask[0];
  }

  async deleteTask(userId: number, taskId: number) {
    await this.hasPermission(userId, taskId);

    const existingTask = await this.existingTask(taskId);

    if (existingTask.jobId) {
      const oldJob = await this.zyphir_queue.getJob(existingTask.jobId);
      if (oldJob) {
        await oldJob.remove();
      }
    }

    const db = this.drizzleService.getClient();

    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  }

  async getTaskLogs(userId: number, taskId: number): Promise<TaskLog[]> {
    await this.hasPermission(userId, taskId);

    const db = this.drizzleService.getClient();

    const taskLogs: TaskLog[] = await db
      .select()
      .from(taskLogsTable)
      .where(eq(taskLogsTable.taskId, taskId))
      .orderBy(desc(taskLogsTable.startedAt));
    return taskLogs;
  }
}
