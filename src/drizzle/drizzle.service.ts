import { Injectable, OnModuleInit } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "@/drizzle/drizzle.schema";

@Injectable()
export class DrizzleService implements OnModuleInit {
  private db: ReturnType<typeof drizzle<typeof schema>>;

  onModuleInit() {
    const globalForDb = globalThis as unknown as {
      conn: postgres.Sql | undefined;
    };

    const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
    if (env.NODE_ENV !== "development") globalForDb.conn = conn;

    this.db = drizzle(conn, { schema });
  }

  getClient() {
    return this.db;
  }
}
