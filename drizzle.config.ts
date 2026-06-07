import { type Config } from "drizzle-kit";

export default {
  schema: "./lib/drizzle/drizzle.schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: String(process.env.DATABASE_URL),
  },
} satisfies Config;
