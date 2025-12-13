import { Injectable, Logger as NestLogger } from "@nestjs/common";
import { DrizzleService } from "@/drizzle/drizzle.service";
import { errorLogsTable } from "@/drizzle/drizzle.schema";
import { LogEntry, LogLevel, LogMetadata } from "./logger.types";
import { EnvService } from "@/env/env.service";
import { Request } from "express";

@Injectable()
export class LoggerService {
  private readonly nestLogger = new NestLogger();
  private readonly logLevel: LogLevel;

  constructor(
    private drizzleService: DrizzleService,
    private envService: EnvService,
  ) {
    // Get log level from environment or default to INFO
    this.logLevel = (envService.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
    ];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private async saveToDatabase(entry: LogEntry): Promise<void> {
    try {
      await this.drizzleService
        .getClient()
        .insert(errorLogsTable)
        .values({
          userId: entry.userId || null,
          level: entry.level,
          context: entry.context,
          message: entry.message,
          stack: entry.stack,
          metadata: entry.metadata,
          endpoint: entry.endpoint,
          method: entry.method,
          requestId: entry.requestId,
        });
    } catch (error) {
      const err = error as Error;
      this.nestLogger.error(
        `Failed to save log to database: ${err.message}`,
        err.stack,
        "LoggerService",
      );
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: LogMetadata,
  ): void {
    if (!this.shouldLog(level)) return;

    const logMessage = metadata
      ? `${message} ${JSON.stringify(metadata)}`
      : message;

    switch (level) {
      case LogLevel.ERROR:
        this.nestLogger.error(logMessage, null, context);
        break;
      case LogLevel.WARN:
        this.nestLogger.warn(logMessage, context);
        break;
      case LogLevel.INFO:
        this.nestLogger.log(logMessage, context);
        break;
      case LogLevel.DEBUG:
        this.nestLogger.debug(logMessage, context);
        break;
    }
  }

  async error(
    message: string,
    error?: Error,
    context?: string,
    metadata?: LogMetadata,
    userId?: string,
    endpoint?: string,
    method?: string,
  ): Promise<void> {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      context,
      stack: error?.stack,
      metadata,
      userId,
      endpoint,
      method,
    };

    this.log(LogLevel.ERROR, message, context, metadata);
    await this.saveToDatabase(entry);
  }

  async warn(
    message: string,
    context?: string,
    metadata?: LogMetadata,
    userId?: string,
  ): Promise<void> {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      context,
      metadata,
      userId,
    };

    this.log(LogLevel.WARN, message, context, metadata);

    // Only save warnings to database if configured
    if (this.envService.LOG_WARNINGS_TO_DB === "true") {
      await this.saveToDatabase(entry);
    }
  }

  info(message: string, context?: string, metadata?: LogMetadata): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: LogMetadata): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  // Helper method for logging HTTP errors
  async logHttpError(
    error: Error,
    request: Request,
    userId?: string,
  ): Promise<void> {
    const metadata: LogMetadata = {
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      query: request.query,
      params: request.params,
    };

    await this.error(
      `HTTP Error: ${error.message}`,
      error,
      "HTTP",
      metadata,
      userId,
    );
  }
}
