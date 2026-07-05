import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [PrismaModule],
  controllers: [CheckoutController],
  providers: [CheckoutService]
})
export class CheckoutModule {}
