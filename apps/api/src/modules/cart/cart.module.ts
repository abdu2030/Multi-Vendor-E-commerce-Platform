import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CartCacheService } from "./cart-cache.service";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartCacheService, CartService],
  exports: [CartCacheService]
})
export class CartModule {}
