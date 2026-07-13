import { ForbiddenException, NotFoundException, ValidationPipe } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { OrderStatus, ProductStatus, Role, SellerStatus } from "@prisma/client";
import { Request } from "express";
import { ROLES_KEY } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AuthenticatedUser } from "../../common/types/authenticated-user";
import { createValidationException } from "../../common/validation/validation-errors";
import { EmailQueueService } from "../jobs/email-queue.service";
import { OrdersService } from "../orders/orders.service";
import { PrismaService } from "../prisma/prisma.service";
import { SellerOrdersService } from "../seller-orders/seller-orders.service";
import { SellerProductsService } from "../seller-products/seller-products.service";
import { RegisterDto } from "../auth/dto/register.dto";
import { UsersService } from "../users/users.service";

describe("Authorization and ownership controls", () => {
  it("prevents a customer from reading another customer's order", async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };
    const service = new OrdersService(prisma as unknown as PrismaService);

    await expect(service.getBuyerOrder("buyer_1", "order_other")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.order.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "order_other", buyerId: "buyer_1" }
    }));
  });

  it("prevents a customer from editing another customer's address", async () => {
    const prisma = {
      address: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
        update: jest.fn()
      },
      $transaction: jest.fn()
    };
    const service = new UsersService(prisma as unknown as PrismaService);

    await expect(service.setDefaultAddress("user_1", "address_other")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: { id: "address_other", userId: "user_1" },
      select: { id: true }
    });
    expect(prisma.address.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("prevents a vendor from editing another vendor's product", async () => {
    const prisma = buildSellerProductPrisma("seller_other");
    const service = new SellerProductsService(prisma as unknown as PrismaService);

    await expect(service.update("seller_owner", "product_1", { title: "Blocked Product Update" })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.product.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "product_1" }
    }));
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it("prevents a vendor from viewing another vendor's revenue-bearing order item", async () => {
    const prisma = {
      sellerProfile: {
        findUnique: jest.fn().mockResolvedValue({
          status: SellerStatus.APPROVED,
          store: {
            id: "store_owner",
            name: "Owner Store",
            slug: "owner-store",
            status: SellerStatus.APPROVED
          }
        })
      },
      orderItem: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    };
    const service = new SellerOrdersService(
      prisma as unknown as PrismaService,
      { enqueue: jest.fn() } as unknown as EmailQueueService
    );

    await expect(service.getOne("seller_owner", "item_other")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.orderItem.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "item_other",
        storeId: "store_owner"
      }
    }));
  });

  it("prevents a normal user from accessing admin endpoints", () => {
    const guard = new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN])
    } as unknown as Reflector);
    const request = buildRequest({ id: "user_1", role: Role.BUYER });

    expect(() => guard.canActivate(buildHttpContext(request))).toThrow(ForbiddenException);
  });

  it("prevents users from assigning or changing their own role through request bodies", async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationException
    });

    await expect(pipe.transform(
      {
        fullName: "Buyer One",
        email: "buyer@example.com",
        password: "StrongPass123",
        role: Role.ADMIN
      },
      { type: "body", metatype: RegisterDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "role" })])
      }
    });
  });
});

function buildSellerProductPrisma(ownerUserId: string) {
  return {
    product: {
      findUnique: jest.fn().mockResolvedValue({
        id: "product_1",
        storeId: "store_other",
        categoryId: "category_1",
        title: "Other Seller Product",
        slug: "other-seller-product",
        description: "Product owned by another seller.",
        priceCents: 1000,
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
            userId: ownerUserId
          }
        },
        category: {
          id: "category_1",
          name: "Category",
          slug: "category"
        },
        images: [],
        variants: []
      }),
      update: jest.fn(),
      findFirst: jest.fn()
    }
  };
}

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

function buildRequest(user: AuthenticatedUser) {
  return { user } as AuthenticatedRequest;
}

function buildHttpContext(request: AuthenticatedRequest) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request
    })
  } as never;
}