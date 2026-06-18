import { pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const usersTable = pgTable("users", (d) => ({
  id: uuid().notNull().defaultRandom().primaryKey(),
  email: d.varchar({ length: 255 }).notNull().unique(),
  password: d.varchar({ length: 255 }).notNull(),
}));

export const tasksTable = pgTable("tasks", (d) => ({
  id: uuid().notNull().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: d.varchar({ length: 255 }).notNull(),
  description: d.text(),
  targetUrl: d.varchar({ length: 2048 }).notNull(),
  method: d.varchar({ length: 10 }).notNull().default("POST"),
  headers: d.jsonb(),
  cron: d.varchar({ length: 255 }).notNull(),
  payload: d.text(),
  isActive: d.boolean().notNull().default(true),
  createdAt: d.timestamp().notNull().defaultNow(),
  updatedAt: d.timestamp().notNull().defaultNow(),
}));

export const jobsTable = pgTable("jobs", (d) => ({
  id: uuid().notNull().defaultRandom().primaryKey(),
  taskId: uuid()
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  schedulerId: d.varchar({ length: 500 }).notNull().unique(),
  status: d.varchar({ length: 20 }).notNull().default("active"),
  attempts: d.integer().notNull().default(5),
  backoffDelay: d.integer().notNull().default(5000),
  nextRunAt: d.timestamp(),
  createdAt: d.timestamp().notNull().defaultNow(),
  updatedAt: d.timestamp().notNull().defaultNow(),
}));

export const taskLogsTable = pgTable("task_logs", (d) => ({
  id: d.integer().primaryKey().generatedAlwaysAsIdentity(),
  taskId: uuid()
    .notNull()
    .references(() => tasksTable.id, { onDelete: "cascade" }),
  jobId: uuid().references(() => jobsTable.id, { onDelete: "set null" }),
  bullInstanceId: d.varchar({ length: 255 }),
  status: d.boolean().notNull(),
  responseCode: d.varchar({ length: 255 }),
  responseBody: d.text(),
  startedAt: d.timestamp(),
  completedAt: d.timestamp(),
  durationMs: d.integer(),
  attempt: d.integer().notNull(),
  retry: d.boolean().notNull(),
}));

export const errorLogsTable = pgTable("error_logs", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: uuid().references(() => usersTable.id, { onDelete: "cascade" }),
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
  jobs: many(jobsTable),
  taskLogs: many(taskLogsTable),
}));

export const jobsRelations = relations(jobsTable, ({ one, many }) => ({
  task: one(tasksTable, {
    fields: [jobsTable.taskId],
    references: [tasksTable.id],
  }),
  taskLogs: many(taskLogsTable),
}));

export const tasksLogsRelations = relations(taskLogsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskLogsTable.taskId],
    references: [tasksTable.id],
  }),
  job: one(jobsTable, {
    fields: [taskLogsTable.jobId],
    references: [jobsTable.id],
  }),
}));

export const errorLogsRelations = relations(errorLogsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [errorLogsTable.userId],
    references: [usersTable.id],
  }),
}));
