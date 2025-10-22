import { type Config } from "drizzle-kit";
import { env } from "@/env";

export default {
  schema: "./src/drizzle/drizzle.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
