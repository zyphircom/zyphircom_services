import { Injectable, OnModuleInit } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@lib/drizzle/drizzle.schema";
import { EnvService } from "@lib/env/env.service";

@Injectable()
export class DrizzleService implements OnModuleInit {
  constructor(private envService: EnvService) {}
  private db!: ReturnType<typeof drizzle<typeof schema>>;

  onModuleInit() {
    const globalForDb = globalThis as unknown as {
      conn: postgres.Sql | undefined;
    };

    const conn = globalForDb.conn ?? postgres(this.envService.DATABASE_URL);

    if (this.envService.NODE_ENV === "development") globalForDb.conn = conn;

    this.db = drizzle(conn, { schema });
  }

  getClient() {
    return this.db;
  }
}
