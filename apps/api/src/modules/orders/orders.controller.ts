import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { OrdersService } from "./orders.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listBuyerOrders(user.id);
  }

  @Get(":id")
  getMine(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseCuidPipe) id: string) {
    return this.ordersService.getBuyerOrder(user.id, id);
  }
}
