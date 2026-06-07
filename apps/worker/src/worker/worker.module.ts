import { Module } from "@nestjs/common";
import { WorkerService } from "./worker.service";
import { EnvModule } from "@lib/env/env.module";
import { DrizzleModule } from "@lib/drizzle/drizzle.module";

@Module({
  imports: [EnvModule, DrizzleModule],
  providers: [WorkerService],
})
export class WorkerModule {}
