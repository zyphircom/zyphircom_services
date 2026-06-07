import { Module } from "@nestjs/common";
import { EnvModule } from "@lib/env/env.module";
import { DrizzleModule } from "@lib/drizzle/drizzle.module";
import envConfig from "@lib/config/env.config";
import { ConfigModule } from "@nestjs/config";
import { WorkerModule } from "./worker/worker.module";

@Module({
  imports: [
    EnvModule,
    DrizzleModule,
    WorkerModule,
    ConfigModule.forRoot({ load: [envConfig] }),
  ],
})
export class AppModule {}
