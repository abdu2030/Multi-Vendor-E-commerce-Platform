import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { ListSellerOrdersQueryDto } from "./dto/list-seller-orders-query.dto";
import { UpdateSellerOrderFulfillmentDto } from "./dto/update-seller-order-fulfillment.dto";
import { SellerOrdersService } from "./seller-orders.service";

@Controller("seller/orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerOrdersController {
  constructor(private readonly sellerOrdersService: SellerOrdersService) {}

  @Get()
  getAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ListSellerOrdersQueryDto) {
    return this.sellerOrdersService.getAll(user.id, query);
  }

  @Get(":itemId")
  getOne(@CurrentUser() user: AuthenticatedUser, @Param("itemId", ParseCuidPipe) itemId: string) {
    return this.sellerOrdersService.getOne(user.id, itemId);
  }

  @Patch(":itemId/fulfillment")
  updateFulfillment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("itemId", ParseCuidPipe) itemId: string,
    @Body() dto: UpdateSellerOrderFulfillmentDto
  ) {
    return this.sellerOrdersService.updateFulfillment(user.id, itemId, dto);
  }
}
