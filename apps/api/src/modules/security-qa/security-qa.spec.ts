import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  ValidationPipe
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ProductStatus, Role, SellerStatus } from "@prisma/client";
import { Request } from "express";
import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { createValidationException } from "../../common/validation/validation-errors";
import { JwtTokenService } from "../auth/jwt-token.service";
import { RegisterDto } from "../auth/dto/register.dto";
import { UploadImageDto } from "../seller-uploads/dto/upload-image.dto";
import { CartCacheService } from "../cart/cart-cache.service";
import { CheckoutService } from "../checkout/checkout.service";
import { EmailQueueService } from "../jobs/email-queue.service";
import { SellerProductsService } from "../seller-products/seller-products.service";

describe("Security QA", () => {
  describe("role access", () => {
    it("requires a bearer token and attaches the verified user to the request", () => {
      const verifiedUser = buildUser({ id: "admin_1", role: Role.ADMIN });
      const request = buildRequest({ authorization: "Bearer valid_access_token" });
      const guard = new JwtAuthGuard({
        verifyAccessToken: jest.fn().mockReturnValue(verifiedUser)
      } as unknown as JwtTokenService);

      expect(guard.canActivate(buildHttpContext(request))).toBe(true);
      expect(request.user).toEqual(verifiedUser);
    });

    it("rejects missing or malformed authorization headers", () => {
      const guard = new JwtAuthGuard({
        verifyAccessToken: jest.fn()
      } as unknown as JwtTokenService);

      expect(() => guard.canActivate(buildHttpContext(buildRequest()))).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(buildHttpContext(buildRequest({ authorization: "Basic token" })))).toThrow(UnauthorizedException);
    });

    it("blocks authenticated users without the required role", () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN])
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);
      const request = buildRequest();

      request.user = buildUser({ id: "buyer_1", role: Role.BUYER });

      expect(() => guard.canActivate(buildHttpContext(request))).toThrow(ForbiddenException);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
    });

    it("allows requests when no role metadata is required", () => {
      const guard = new RolesGuard({
        getAllAndOverride: jest.fn().mockReturnValue(undefined)
      } as unknown as Reflector);

      expect(guard.canActivate(buildHttpContext(buildRequest()))).toBe(true);
    });
  });

  describe("seller ownership", () => {
    it("cloaks products owned by another seller as not found", async () => {
      const prisma = {
        product: {
          findUnique: jest.fn().mockResolvedValue(buildSellerProduct({ sellerUserId: "seller_other" }))
        }
      };
      const service = new SellerProductsService(prisma as never);

      await expect(service.getOne("seller_owner", "product_1")).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.update("seller_owner", "product_1", { title: "Blocked Update" })).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.product.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "product_1" }
      }));
    });

    it("scopes product lists to the authenticated seller store", async () => {
      const prisma = {
        sellerProfile: {
          findUnique: jest.fn().mockResolvedValue({
            status: SellerStatus.APPROVED,
            store: {
              id: "store_owner",
              status: SellerStatus.APPROVED
            }
          })
        },
        product: {
          findMany: jest.fn().mockResolvedValue([])
        }
      };
      const service = new SellerProductsService(prisma as never);

      await service.getAll("seller_owner", { status: ProductStatus.DRAFT, categoryId: "category_1" });

      expect(prisma.sellerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: "seller_owner" },
        include: { store: true }
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          storeId: "store_owner",
          status: ProductStatus.DRAFT,
          categoryId: "category_1"
        }
      }));
    });
  });

  describe("webhook validation", () => {
    it("rejects Stripe webhooks without a signature or raw body before DB processing", async () => {
      const prisma = {
        webhookEvent: {
          findUnique: jest.fn()
        }
      };
      const service = createCheckoutService(prisma);

      await expect(service.handleStripeWebhook(undefined, Buffer.from("{}"))).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.handleStripeWebhook("stripe-signature", undefined)).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.webhookEvent.findUnique).not.toHaveBeenCalled();
    });

    it("rejects invalid Stripe webhook signatures before recording webhook events", async () => {
      const prisma = {
        webhookEvent: {
          findUnique: jest.fn()
        }
      };
      const service = createCheckoutService(prisma);

      await expect(service.handleStripeWebhook("invalid-signature", Buffer.from("{}"))).rejects.toThrow("Invalid Stripe webhook signature.");
      expect(prisma.webhookEvent.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("input validation", () => {
    it("returns field-level messages and rejects extra body fields", async () => {
      const pipe = createSecurityValidationPipe();

      await expect(pipe.transform(
        {
          fullName: "A",
          email: "not-an-email",
          password: "short",
          unexpected: "blocked"
        },
        { type: "body", metatype: RegisterDto }
      )).rejects.toMatchObject({
        response: {
          message: "Validation failed. Please check the highlighted fields.",
          errors: expect.arrayContaining([
            expect.objectContaining({ field: "fullName" }),
            expect.objectContaining({ field: "email" }),
            expect.objectContaining({ field: "password" }),
            expect.objectContaining({ field: "unexpected" })
          ])
        }
      });
    });

    it("rejects dangerous upload sources before Cloudinary receives them", async () => {
      const pipe = createSecurityValidationPipe();

      await expect(pipe.transform(
        { file: "javascript:alert(1)" },
        { type: "body", metatype: UploadImageDto }
      )).rejects.toMatchObject({
        response: {
          errors: expect.arrayContaining([expect.objectContaining({ field: "file" })])
        }
      });
      await expect(pipe.transform(
        { file: "data:image/svg+xml;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" },
        { type: "body", metatype: UploadImageDto }
      )).rejects.toMatchObject({
        response: {
          errors: expect.arrayContaining([expect.objectContaining({ field: "file" })])
        }
      });
    });
  });
});

function createSecurityValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: createValidationException
  });
}
type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

function buildRequest(headers: Record<string, string> = {}) {
  return { headers } as AuthenticatedRequest;
}

function buildHttpContext(request: AuthenticatedRequest) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as unknown as ExecutionContext;
}

function buildUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: "user_1",
    email: "user@example.com",
    fullName: "User One",
    role: Role.BUYER,
    ...overrides
  };
}

function createCheckoutService(prisma: Record<string, unknown>) {
  return new CheckoutService(
    prisma as never,
    { invalidate: jest.fn() } as unknown as CartCacheService,
    { enqueue: jest.fn() } as unknown as EmailQueueService,
    {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: ["sk", "test", "local"].join("_"),
          STRIPE_WEBHOOK_SECRET: "stripe-webhook-local",
          FRONTEND_URL: "http://localhost:3000"
        };

        return values[key];
      })
    } as never
  );
}

function buildSellerProduct({ sellerUserId }: { sellerUserId: string }) {
  return {
    id: "product_1",
    storeId: "store_other",
    categoryId: "category_1",
    title: "Private Product",
    slug: "private-product",
    description: "A product owned by another seller.",
    priceCents: 2500,
    currency: "USD",
    stockQuantity: 5,
    status: ProductStatus.DRAFT,
    tags: [],
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    store: {
      id: "store_other",
      name: "Other Store",
      sellerProfile: {
        userId: sellerUserId
      }
    },
    category: {
      id: "category_1",
      name: "Category",
      slug: "category"
    },
    images: [],
    variants: []
  };
}

