import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    JWT_SECRET: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.string(),
  },
  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
