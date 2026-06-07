import { DrizzleService } from "@lib/drizzle/drizzle.service";
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateTaskDto, EditTaskDto } from "@api/task/task.dto";
import { taskLogsTable, tasksTable } from "@lib/drizzle/drizzle.schema";
import { desc, eq } from "drizzle-orm";
import { Task, TaskLog } from "@api/task/task.types";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { LoggerService } from "@lib/logger/logger.service";
import { appConstants } from "@lib/constants";

@Injectable()
export class TaskService {
  constructor(
    private drizzleService: DrizzleService,
    @InjectQueue(appConstants.QUEUE_NAME) private readonly zyphir_queue: Queue,
    private logger: LoggerService,
  ) {}

  /**
   * Validates that a user has permission to access a specific task.
   *
   * This method verifies task ownership by checking if the provided userId matches the task's owner in the database.
   * It's used as a guard to ensure users can only perform actions on tasks they own.
   *
   * @param userId - The ID of the user attempting to access the task
   * @param taskId - The ID of the task to check permissions for
   *
   * @throws {NotFoundException} When the task with the given taskId does not exist
   * @throws {ForbiddenException} When the user does not own the task
   * @throws {Error} For any unexpected database or system errors (logged automatically)
   *
   * @returns A Promise that resolves to void if permission check passes
   *
   * @remarks
   * - This is a private method intended for internal permission validation
   * - Errors are logged (except NotFoundException and ForbiddenException) before being re-thrown
   *
   * @example
   * ```typescript
   * // Used internally before performing task operations
   * await this.hasPermission(currentUserId, taskIdToUpdate);
   * // If this succeeds, proceed with the operation
   * ```
   *
   * @private
   */
  private async hasPermission(userId: string, taskId: string): Promise<void> {
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

  /**
   * Retrieves a task by its ID and validates that it exists.
   *
   * This method fetches a task from the database and throws an exception if the
   * task is not found. It's used as a helper method to ensure a task exists before
   * performing operations on it.
   *
   * @param taskId - The ID of the task to retrieve
   *
   * @returns A Promise that resolves to the task object if found
   *
   * @throws {NotFoundException} When the task with the given taskId does not exist
   *
   * @remarks
   * - This is a private helper method for internal task validation
   * - Returns the complete task object from the database
   * - Uses Drizzle ORM for database queries
   *
   * @example
   * ```typescript
   * // Used internally to validate task existence
   * const task = await this.existingTask(taskId);
   * // task now contains all fields from tasksTable
   * ```
   *
   * @private
   */
  private async existingTask(taskId: string) {
    const db = this.drizzleService.getClient();

    const task = await db
      .select({
        targetUrl: tasksTable.targetUrl,
        cron: tasksTable.cron,
        payload: tasksTable.payload,
        jobId: tasksTable.jobId,
      })
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId));

    if (!task[0]) {
      throw new NotFoundException("Task not found");
    }

    return task[0];
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<Task> {
    const db = this.drizzleService.getClient();
    const taskName = `task_${userId}_${Date.now()}`;

    const newTask: Task[] = await db
      .insert(tasksTable)
      .values({ ...createTaskDto, userId: userId })
      .returning();

    const taskId = newTask[0].id;

    const job = await this.zyphir_queue.add(
      taskName,
      { taskId, ...createTaskDto },
      {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        repeat: { pattern: createTaskDto.cron },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    if (!job.id) {
      throw new InternalServerErrorException();
    }
    await db
      .update(tasksTable)
      .set({ jobId: job.id })
      .where(eq(tasksTable.id, newTask[0].id));

    return newTask[0];
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    const db = this.drizzleService.getClient();

    return await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId))
      .orderBy(desc(tasksTable.createdAt));
  }

  async editTask(
    userId: string,
    taskId: string,
    editTaskDto: EditTaskDto,
  ): Promise<Task> {
    await this.hasPermission(userId, taskId);

    const existingTask = await this.existingTask(taskId);
    const db = this.drizzleService.getClient();

    if (existingTask.jobId) {
      const oldJob = await this.zyphir_queue.getJob(existingTask.jobId);
      if (oldJob) {
        if (oldJob.repeatJobKey) {
          await this.zyphir_queue.removeJobScheduler(oldJob.repeatJobKey);
        }
        await oldJob.remove().catch(() => null);
      }
    }

    const { jobId, ...taskWithoutJobId } = existingTask;

    const taskWithUpdates = {
      ...taskWithoutJobId,
      ...editTaskDto,
    };

    const newJob = await this.zyphir_queue.add(
      `task_${userId}_${Date.now()}`,
      { taskId, ...taskWithUpdates },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 5000 },
        repeat: { pattern: taskWithUpdates.cron },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    if (!newJob?.id) {
      throw new InternalServerErrorException("Failed to schedule job");
    }

    try {
      const updatedTask: Task[] = await db
        .update(tasksTable)
        .set({ ...taskWithUpdates, jobId: newJob.id, updatedAt: new Date() })
        .where(eq(tasksTable.id, taskId))
        .returning();

      return updatedTask[0];
    } catch (error) {
      console.error("DB Update failed, rolling back queue job:", newJob.id);

      if (newJob.repeatJobKey) {
        await this.zyphir_queue.removeJobScheduler(newJob.repeatJobKey);
      } else {
        await newJob.remove();
      }

      throw new InternalServerErrorException("Failed to update task");
    }
  }

  async deleteTask(userId: string, taskId: string) {
    await this.hasPermission(userId, taskId);

    const existingTask = await this.existingTask(taskId);

    if (existingTask.jobId) {
      const oldJob = await this.zyphir_queue.getJob(existingTask.jobId);
      if (oldJob && oldJob.repeatJobKey) {
        await this.zyphir_queue.removeJobScheduler(oldJob.repeatJobKey);
      }
    }

    const db = this.drizzleService.getClient();

    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  }

  async getTaskLogs(userId: string, taskId: string): Promise<TaskLog[]> {
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
