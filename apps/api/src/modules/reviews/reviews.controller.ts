import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ParseCuidPipe } from "../../common/validation/cuid";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewsService } from "./reviews.service";

@Controller("products/:productId/reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  listForProduct(@Param("productId", ParseCuidPipe) productId: string) {
    return this.reviewsService.listForProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId", ParseCuidPipe) productId: string,
    @Body() dto: CreateReviewDto
  ) {
    return this.reviewsService.createVerifiedPurchaseReview(user.id, productId, dto);
  }
}
