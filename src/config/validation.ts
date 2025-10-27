import z from "zod";

const nonEmptyString = (field: string) =>
  z.string().trim().min(1, `${field} is required`);

export const envSchema = z.object({
  APP_NAME: nonEmptyString("APP_NAME"),
  DATABASE_URL: nonEmptyString("DATABASE_URL"),
  NODE_ENV: nonEmptyString("NODE_ENV"),
  JWT_SECRET: nonEmptyString("JWT_SECRET"),
  REDIS_HOST: nonEmptyString("REDIS_HOST"),
  REDIS_PORT: nonEmptyString("REDIS_PORT"),
  LOG_LEVEL: z
    .enum(["DEBUG", "INFO", "WARN", "ERROR"])
    .optional()
    .default("INFO"),
  LOG_WARNINGS_TO_DB: z.boolean().optional().default(false),
});

export type Env = z.infer<typeof envSchema>;
