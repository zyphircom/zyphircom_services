import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { appConstants } from "@lib/constants";

@Module({
  imports: [BullModule.registerQueue({ name: appConstants.QUEUE_NAME })],
  exports: [BullModule],
})
export class QueueModule {}
