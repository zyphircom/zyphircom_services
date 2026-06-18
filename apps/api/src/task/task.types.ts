export type Task = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  targetUrl: string;
  method: string;
  headers: Record<string, string> | null;
  cron: string;
  payload: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Job = {
  id: string;
  taskId: string;
  schedulerId: string;
  status: string;
  attempts: number;
  backoffDelay: number;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskLog = {
  id: number;
  taskId: string;
  jobId: string | null;
  bullInstanceId: string | null;
  status: boolean;
  responseCode: string | null;
  responseBody: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  attempt: number;
  retry: boolean;
};
