import { pgTable } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", (d) => ({
  id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
  email: d.varchar({ length: 255 }).notNull().unique(),
  password: d.varchar({ length: 255 }).notNull(),
}));

export const tasksTable = pgTable("tasks", (d) => ({
  id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: d
    .integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  targetUrl: d.varchar({ length: 255 }).notNull(),
  cron: d.varchar({ length: 255 }).notNull(),
  payload: d.text(),
  createdAt: d.timestamp().notNull().defaultNow(),
  updatedAt: d.timestamp(),
}));

export const taskLogsTable = pgTable("task_logs", (d) => ({
  id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: d
    .integer()
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  status: d.boolean().notNull(),
  responseCode: d.varchar({ length: 255 }),
  responseBody: d.text(),
  startedAt: d.timestamp(),
  completedAt: d.timestamp(),
  attempt: d.integer().notNull(),
  retry: d.boolean().notNull(),
}));
