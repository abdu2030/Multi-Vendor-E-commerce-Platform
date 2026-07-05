import { Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { CheckoutService } from "./checkout.service";

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller("checkout/webhooks")
export class CheckoutWebhookController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("stripe")
  @HttpCode(200)
  handleStripeWebhook(
    @Headers("stripe-signature") signature: string | undefined,
    @Req() request: RawBodyRequest
  ) {
    return this.checkoutService.handleStripeWebhook(signature, request.rawBody);
  }
}
