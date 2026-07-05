import { Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { CheckoutService } from "./checkout.service";

@Controller("checkout")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("sessions")
  createSession(@CurrentUser() user: AuthenticatedUser) {
    return this.checkoutService.createCheckoutSession(user.id);
  }
}
