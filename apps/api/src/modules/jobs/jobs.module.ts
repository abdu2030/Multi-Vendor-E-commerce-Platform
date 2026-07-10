import { Global, Module } from "@nestjs/common";
import { NotificationProcessor } from "./notification.processor";
import { NotificationQueueService } from "./notification-queue.service";
import { RedisConnectionFactory } from "./redis-connection.factory";

@Global()
@Module({
  providers: [RedisConnectionFactory, NotificationQueueService, NotificationProcessor],
  exports: [NotificationQueueService]
})
export class JobsModule {}
