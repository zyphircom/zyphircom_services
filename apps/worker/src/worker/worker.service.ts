import { DrizzleService } from "@lib/drizzle/drizzle.service";
import { EnvService } from "@lib/env/env.service";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Worker, Job } from "bullmq";
import axios from "axios";
import { taskLogsTable } from "@lib/drizzle/drizzle.schema";
import { appConstants } from "@lib/constants";

@Injectable()
export class WorkerService implements OnModuleInit {
  private worker!: Worker;

  constructor(
    private envService: EnvService,
    private drizzleService: DrizzleService,
  ) {}

  private async processJob(job: Job) {
    const {
      taskId,
      targetUrl,
      method = "POST",
      headers = {},
      payload,
    } = job.data;
    const db = this.drizzleService.getClient();
    const startedAt = new Date();

    const normalize = (data: any) =>
      typeof data === "string" ? data : JSON.stringify(data ?? null);

    try {
      const config: any = {
        method: method.toUpperCase(),
        url: targetUrl,
        headers: headers || {},
        timeout: 10000,
      };

      if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
        config.data = payload;
      }

      const response = await axios(config);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      console.log(
        `Task Id ${taskId} executed successfully with ${method} ${response.status}`,
      );

      await db.insert(taskLogsTable).values({
        taskId: taskId,
        bullInstanceId: job.id,
        status: true,
        responseCode: String(response.status),
        responseBody: normalize(response.data).slice(0, 5000),
        startedAt: startedAt,
        completedAt: completedAt,
        durationMs: durationMs,
        attempt: job.attemptsMade + 1,
        retry: job.attemptsMade > 0,
      });
    } catch (error: any) {
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      console.log(`Task ID ${taskId} failed ${error.message}`);

      await db.insert(taskLogsTable).values({
        taskId: taskId,
        bullInstanceId: job.id,
        status: false,
        responseCode: String(error?.response?.status || 500),
        responseBody: normalize(error?.response?.data ?? error.message).slice(
          0,
          5000,
        ),
        startedAt: startedAt,
        completedAt: completedAt,
        durationMs: durationMs,
        attempt: job.attemptsMade + 1,
        retry: job.attemptsMade > 0,
      });

      // rethrow so bullmq can handle the retry logic
      throw error;
    }
  }

  async onModuleInit() {
    this.worker = new Worker(
      appConstants.QUEUE_NAME,
      async (job: Job) => this.processJob(job),
      {
        connection: {
          host: this.envService.REDIS_HOST,
          port: this.envService.REDIS_PORT,
        },
      },
    );

    this.worker.on("completed", (job) => {
      console.log(`Job id ${job.id} completed`);
    });

    this.worker.on("failed", (job, error) => {
      console.log(`Job id ${job?.id} failed - ${error.message}`);
    });

    console.log(
      `Worker initialized and listening on ${appConstants.QUEUE_NAME}`,
    );
  }
}
