import { Module, Global } from "@nestjs/common";
import { DrizzleService } from "@lib/drizzle/drizzle.service";
import { EnvModule } from "@lib/env/env.module";

@Global()
@Module({
  imports: [EnvModule],
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
