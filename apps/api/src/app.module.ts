import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { validateEnv } from "./config/env.validation";
import { AdminCategoriesModule } from "./modules/admin-categories/admin-categories.module";
import { AdminSellerApplicationsModule } from "./modules/admin-seller-applications/admin-seller-applications.module";
import { AdminProductsModule } from "./modules/admin-products/admin-products.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CartModule } from "./modules/cart/cart.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { ProductsModule } from "./modules/products/products.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SellerApplicationsModule } from "./modules/seller-applications/seller-applications.module";
import { SellerDashboardModule } from "./modules/seller-dashboard/seller-dashboard.module";
import { SellerOrdersModule } from "./modules/seller-orders/seller-orders.module";
import { SellerProductsModule } from "./modules/seller-products/seller-products.module";
import { SellerUploadsModule } from "./modules/seller-uploads/seller-uploads.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    PrismaModule,
    JobsModule,
    AuthModule,
    CartModule,
    CheckoutModule,
    NotificationsModule,
    OrdersModule,
    CategoriesModule,
    AdminCategoriesModule,
    AdminSellerApplicationsModule,
    AdminProductsModule,
    ReviewsModule,
    SellerApplicationsModule,
    SellerDashboardModule,
    SellerOrdersModule,
    SellerProductsModule,
    ProductsModule,
    SellerUploadsModule,
    UsersModule
  ],
  controllers: [AppController]
})
export class AppModule {}
