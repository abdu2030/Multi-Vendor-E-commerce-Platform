import { Global, Module } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { PasswordService } from "./password.service";

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtTokenService, PasswordService, RolesGuard],
  exports: [JwtAuthGuard, JwtTokenService, RolesGuard]
})
export class AuthModule {}
