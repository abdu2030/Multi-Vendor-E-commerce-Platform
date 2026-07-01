import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { SellerApplicationsModule } from "./modules/seller-applications/seller-applications.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SellerApplicationsModule],
  controllers: [AppController]
})
export class AppModule {}
