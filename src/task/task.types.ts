export type Task = {
  id: string;
  userId: string;
  targetUrl: string;
  cron: string;
  payload: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskLog = {
  id: number;
  taskId: string;
  status: boolean;
  responseCode: string | null;
  responseBody: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  attempt: number;
  retry: boolean;
};
