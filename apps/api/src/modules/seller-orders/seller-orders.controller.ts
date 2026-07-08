import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { OrderStatus, Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { SellerOrdersService } from "./seller-orders.service";

@Controller("seller/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerOrdersController {
  constructor(private readonly sellerOrdersService: SellerOrdersService) {}

  @Get()
  getAll(@CurrentUser() user: AuthenticatedUser, @Query("status") status?: OrderStatus) {
    return this.sellerOrdersService.getAll(user.id, { status });
  }

  @Get(":itemId")
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("itemId") itemId: string) {
    return this.sellerOrdersService.getOne(user.id, itemId);
  }
}
