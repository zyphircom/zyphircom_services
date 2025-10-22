export type Task = {
  id: number;
  userId: number;
  targetUrl: string;
  cron: string;
  payload: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export type TaskLog = {
  id: number;
  taskId: number;
  status: boolean;
  responseCode: string | null;
  responseBody: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  attempt: number;
  retry: boolean;
};
