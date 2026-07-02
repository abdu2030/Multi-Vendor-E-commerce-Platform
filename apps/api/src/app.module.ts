import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { validateEnv } from "./config/env.validation";
import { AdminSellerApplicationsModule } from "./modules/admin-seller-applications/admin-seller-applications.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { SellerApplicationsModule } from "./modules/seller-applications/seller-applications.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    PrismaModule,
    AuthModule,
    AdminSellerApplicationsModule,
    SellerApplicationsModule,
    UsersModule
  ],
  controllers: [AppController]
})
export class AppModule {}
