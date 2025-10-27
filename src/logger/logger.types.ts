export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

export interface LogMetadata {
  [key: string]: any;
}

export interface LogEntry {
  userId?: number;
  level: LogLevel;
  context?: string;
  message: string;
  stack?: string;
  metadata?: LogMetadata;
  endpoint?: string;
  method?: string;
  requestId?: string;
}

export interface LoggerOptions {
  context?: string;
  userId?: number;
  requestId?: string;
}
