import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutWebhookController } from "./checkout-webhook.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [PrismaModule, CartModule],
  controllers: [CheckoutController, CheckoutWebhookController],
  providers: [CheckoutService]
})
export class CheckoutModule {}
