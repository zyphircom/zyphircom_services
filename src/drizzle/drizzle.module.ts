import { Module, Global } from "@nestjs/common";
import { DrizzleService } from "./drizzle.service";
import { EnvModule } from "@/env/env.module";

@Global()
@Module({
  imports: [EnvModule],
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
