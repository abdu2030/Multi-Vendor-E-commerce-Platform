import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  profile(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Get("addresses")
  getAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getAddresses(user.id);
  }

  @Post("addresses")
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(user.id, dto);
  }

  @Patch("addresses/:addressId/default")
  setDefaultAddress(@CurrentUser() user: AuthenticatedUser, @Param("addressId", ParseCuidPipe) addressId: string) {
    return this.usersService.setDefaultAddress(user.id, addressId);
  }
}
