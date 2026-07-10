import { Global, Module } from "@nestjs/common";
import { EmailProcessor } from "./email.processor";
import { EmailQueueService } from "./email-queue.service";
import { NotificationProcessor } from "./notification.processor";
import { NotificationQueueService } from "./notification-queue.service";
import { RedisConnectionFactory } from "./redis-connection.factory";

@Global()
@Module({
  providers: [
    RedisConnectionFactory,
    NotificationQueueService,
    NotificationProcessor,
    EmailQueueService,
    EmailProcessor
  ],
  exports: [NotificationQueueService, EmailQueueService]
})
export class JobsModule {}
