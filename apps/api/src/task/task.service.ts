import { DrizzleService } from "@lib/drizzle/drizzle.service";
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateTaskDto, EditTaskDto } from "@api/task/task.dto";
import {
  jobsTable,
  taskLogsTable,
  tasksTable,
} from "@lib/drizzle/drizzle.schema";
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
   * @throws {ForbiddenException} When the user does not own the task or the task with the given id does not exist
   * @throws {Error} For any unexpected database or system errors (logged automatically)
   *
   * @returns A Promise that resolves to void if permission check passes
   *
   * @remarks
   * - This is a private method intended for internal permission validation
   * - Errors are logged (except ForbiddenException) before being re-thrown
   *
   * @example
   * ```typescript
   * // Used internally before performing task operations
   * await this.checkPermission(currentUserId, taskIdToUpdate);
   * // If this succeeds, proceed with the operation
   * ```
   *
   * @private
   */
  private async checkPermission(userId: string, taskId: string): Promise<void> {
    const db = this.drizzleService.getClient();

    try {
      const task = await db
        .select({ userId: tasksTable.userId })
        .from(tasksTable)
        .where(eq(tasksTable.id, taskId));

      if (!task || task.length === 0) {
        throw new ForbiddenException(
          "You do not have permission to perform this action.",
        );
      }

      if (task[0].userId !== userId) {
        throw new ForbiddenException(
          "You do not have permission to perform this action.",
        );
      }
    } catch (error) {
      if (!(error instanceof ForbiddenException)) {
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
  private async retrieveTask(taskId: string) {
    const db = this.drizzleService.getClient();

    const task = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId));

    if (!task[0]) {
      throw new NotFoundException("Task not found");
    }

    return task[0] as Task;
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<Task> {
    const db = this.drizzleService.getClient();

    const newTask = await db
      .insert(tasksTable)
      .values({ ...createTaskDto, userId: userId })
      .returning();

    const taskId = newTask[0].id;

    try {
      const job = await this.zyphir_queue.add(
        createTaskDto.name,
        {
          taskId: taskId,
          targetUrl: createTaskDto.targetUrl,
          method: createTaskDto.method,
          headers: createTaskDto.headers,
          payload: createTaskDto.payload,
          cron: createTaskDto.cron,
        },
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

      if (!job.id || !job.repeatJobKey) {
        throw new InternalServerErrorException(
          "Failed to create job scheduler",
        );
      }

      await db.insert(jobsTable).values({
        taskId: taskId,
        schedulerId: job.repeatJobKey,
        status: "active",
      });

      return newTask[0] as Task;
    } catch (error) {
      await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
      throw error;
    }
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    const db = this.drizzleService.getClient();

    return (await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId))
      .orderBy(desc(tasksTable.createdAt))) as Task[];
  }

  async editTask(
    userId: string,
    taskId: string,
    editTaskDto: EditTaskDto,
  ): Promise<Task> {
    await this.checkPermission(userId, taskId);

    const existingTask = await this.retrieveTask(taskId);
    const db = this.drizzleService.getClient();

    const jobRecords = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.taskId, taskId));

    const jobRecord = jobRecords[0];

    if (jobRecord?.schedulerId) {
      try {
        await this.zyphir_queue.removeJobScheduler(jobRecord.schedulerId);
      } catch (error) {
        throw new InternalServerErrorException("Failed to remove existing job");
      }
    }

    const taskWithUpdates = {
      ...existingTask,
      ...editTaskDto,
    };

    const newJob = await this.zyphir_queue.add(
      taskWithUpdates.name,
      {
        taskId: taskId,
        targetUrl: taskWithUpdates.targetUrl,
        method: taskWithUpdates.method,
        headers: taskWithUpdates.headers,
        payload: taskWithUpdates.payload,
        cron: taskWithUpdates.cron,
      },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 5000 },
        repeat: { pattern: taskWithUpdates.cron },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    if (!newJob?.id || !newJob.repeatJobKey) {
      throw new InternalServerErrorException("Failed to schedule job");
    }

    try {
      const updatedTask = await db
        .update(tasksTable)
        .set({ ...editTaskDto, updatedAt: new Date() })
        .where(eq(tasksTable.id, taskId))
        .returning();

      await db
        .update(jobsTable)
        .set({
          schedulerId: newJob.repeatJobKey,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(jobsTable.taskId, taskId));

      return updatedTask[0] as Task;
    } catch (error) {
      if (newJob.repeatJobKey) {
        await this.zyphir_queue.removeJobScheduler(newJob.repeatJobKey);
      }

      throw new InternalServerErrorException("Failed to update task");
    }
  }

  async deleteTask(userId: string, taskId: string) {
    await this.checkPermission(userId, taskId);

    const db = this.drizzleService.getClient();

    const jobRecords = await db
      .select()
      .from(jobsTable)
      .where(eq(jobsTable.taskId, taskId));

    const jobRecord = jobRecords[0];

    if (jobRecord?.schedulerId) {
      try {
        await this.zyphir_queue.removeJobScheduler(jobRecord.schedulerId);
        await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
      } catch (error) {
        throw new InternalServerErrorException("Failed to remove existing job");
      }
    }
  }

  async getTaskLogs(userId: string, taskId: string): Promise<TaskLog[]> {
    await this.checkPermission(userId, taskId);

    const db = this.drizzleService.getClient();

    const taskLogs = await db
      .select()
      .from(taskLogsTable)
      .where(eq(taskLogsTable.taskId, taskId))
      .orderBy(desc(taskLogsTable.startedAt));

    return taskLogs as TaskLog[];
  }
}
