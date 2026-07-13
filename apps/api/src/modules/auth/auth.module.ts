import { Global, Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { LoginRateLimitService } from "./login-rate-limit.service";
import { PasswordService } from "./password.service";

@Global()
@Module({
  imports: [NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtTokenService, LoginRateLimitService, PasswordService, RolesGuard],
  exports: [JwtAuthGuard, JwtTokenService, RolesGuard]
})
export class AuthModule {}
