import { pgTable } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  jobId: d.varchar().notNull(),
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

export const errorLogsTable = pgTable("error_logs", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d.integer().references(() => usersTable.id, { onDelete: "cascade" }),
  level: d.varchar({ length: 20 }).notNull().default("ERROR"),
  context: d.varchar({ length: 255 }),
  message: d.text().notNull(),
  stack: d.text(),
  metadata: d.json(),
  endpoint: d.varchar({ length: 255 }),
  method: d.varchar({ length: 10 }),
  requestId: d.varchar({ length: 255 }),
  createdAt: d.timestamp().notNull().defaultNow(),
}));

// ------------------------------------ RELATIONS ---------------------------------------------

export const userRelations = relations(usersTable, ({ many }) => ({
  tasks: many(tasksTable),
  errors: many(errorLogsTable),
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tasksTable.userId],
    references: [usersTable.id],
  }),
  taskLogs: many(taskLogsTable),
}));

export const tasksLogsRelations = relations(taskLogsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskLogsTable.taskId],
    references: [tasksTable.id],
  }),
}));

export const errorLogsRelations = relations(errorLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [errorLogsTable.userId],
    references: [usersTable.id],
  }),
}));
