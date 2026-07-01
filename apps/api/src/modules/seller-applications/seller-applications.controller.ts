import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateSellerApplicationInput } from "./seller-application.types";
import { SellerApplicationsService } from "./seller-applications.service";

@Controller("sellers")
export class SellerApplicationsController {
  constructor(private readonly sellerApplications: SellerApplicationsService) {}

  @Post("apply")
  apply(@Body() body: CreateSellerApplicationInput) {
    return this.sellerApplications.create(body);
  }

  @Get("me")
  applicationStatus() {
    return {
      message: "Authentication is not wired yet. Use the pending page after submitting a seller application."
    };
  }
}
