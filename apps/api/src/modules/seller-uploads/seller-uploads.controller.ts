import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { UploadImageDto } from "./dto/upload-image.dto";
import { SellerUploadsService } from "./seller-uploads.service";

@Controller("seller/uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerUploadsController {
  constructor(private readonly sellerUploadsService: SellerUploadsService) {}

  @Post("store/logo")
  uploadStoreLogo(@CurrentUser() user: AuthenticatedUser, @Body() dto: UploadImageDto) {
    return this.sellerUploadsService.uploadStoreLogo(user.id, dto);
  }

  @Post("store/banner")
  uploadStoreBanner(@CurrentUser() user: AuthenticatedUser, @Body() dto: UploadImageDto) {
    return this.sellerUploadsService.uploadStoreBanner(user.id, dto);
  }

  @Post("products/:productId/images")
  uploadProductImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseCuidPipe) productId: string,
    @Body() dto: UploadImageDto
  ) {
    return this.sellerUploadsService.uploadProductImage(user.id, productId, dto);
  }
}
