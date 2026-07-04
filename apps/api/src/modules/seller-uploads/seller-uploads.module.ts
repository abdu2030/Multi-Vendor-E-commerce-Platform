import { Module } from "@nestjs/common";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";
import { SellerUploadsController } from "./seller-uploads.controller";
import { SellerUploadsService } from "./seller-uploads.service";

@Module({
  imports: [CloudinaryModule],
  controllers: [SellerUploadsController],
  providers: [SellerUploadsService]
})
export class SellerUploadsModule {}
