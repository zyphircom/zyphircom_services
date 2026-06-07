import { Module } from "@nestjs/common";
import { EnvService } from "@lib/env/env.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
