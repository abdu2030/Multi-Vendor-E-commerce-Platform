import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { CreateSellerApplicationDto } from "./dto/create-seller-application.dto";
import { SellerApplicationsService } from "./seller-applications.service";

@Controller("seller-applications")
@UseGuards(JwtAuthGuard)
export class SellerApplicationsController {
  constructor(private readonly sellerApplicationsService: SellerApplicationsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSellerApplicationDto) {
    return this.sellerApplicationsService.create(user.id, dto);
  }

  @Get("me")
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.sellerApplicationsService.getMine(user.id);
  }
}
