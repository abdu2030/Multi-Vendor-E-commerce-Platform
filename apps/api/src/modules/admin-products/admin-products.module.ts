import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminProductsController } from "./admin-products.controller";
import { AdminProductsService } from "./admin-products.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminProductsController],
  providers: [AdminProductsService]
})
export class AdminProductsModule {}