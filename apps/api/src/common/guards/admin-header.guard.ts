import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

@Injectable()
export class AdminHeaderGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const role = request.headers["x-user-role"];

    if (role !== "admin") {
      throw new ForbiddenException("Admin access is required for seller approval actions.");
    }

    return true;
  }
}
