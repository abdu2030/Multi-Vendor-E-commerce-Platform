import { ConflictException, ForbiddenException } from "@nestjs/common";
import { NotificationType, OrderStatus, Prisma, ReviewStatus } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { ReviewsService } from "./reviews.service";

describe("ReviewsService", () => {
  function createService(prisma: Record<string, unknown>, notifications: Partial<NotificationsService> = {}) {
    return new ReviewsService(
      prisma as never,
      { create: jest.fn(), ...notifications } as unknown as NotificationsService
    );
  }

  it("rejects reviews from buyers without a paid or fulfilled order item", async () => {
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(buildProduct()) },
      orderItem: { findFirst: jest.fn().mockResolvedValue(null) },
      review: { findUnique: jest.fn() },
      $transaction: jest.fn()
    };
    const service = createService(prisma);

    await expect(service.createVerifiedPurchaseReview("buyer_1", "product_1", {
      rating: 5,
      comment: "Excellent product quality."
    })).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: {
        productId: "product_1",
        order: {
          buyerId: "buyer_1",
          status: { in: [OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED] }
        }
      },
      select: { id: true, orderId: true }
    });
    expect(prisma.review.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("prevents a buyer from reviewing the same product twice", async () => {
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(buildProduct()) },
      orderItem: { findFirst: jest.fn().mockResolvedValue({ id: "order_item_1", orderId: "order_1" }) },
      review: { findUnique: jest.fn().mockResolvedValue({ id: "review_existing" }) },
      $transaction: jest.fn()
    };
    const service = createService(prisma);

    await expect(service.createVerifiedPurchaseReview("buyer_1", "product_1", {
      rating: 4,
      comment: "Solid product after a week."
    })).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.review.findUnique).toHaveBeenCalledWith({
      where: {
        productId_buyerId: {
          productId: "product_1",
          buyerId: "buyer_1"
        }
      },
      select: { id: true }
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates verified reviews, recalculates approved rating totals, and notifies the seller", async () => {
    const createdReview = buildReview();
    const tx = {
      review: {
        create: jest.fn().mockResolvedValue(createdReview),
        aggregate: jest.fn().mockResolvedValue({
          _avg: { rating: 4.333333333 },
          _count: { rating: 3 }
        })
      },
      product: { update: jest.fn() },
      auditLog: { create: jest.fn() }
    };
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(buildProduct()) },
      orderItem: { findFirst: jest.fn().mockResolvedValue({ id: "order_item_1", orderId: "order_1" }) },
      review: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const notifications = { create: jest.fn().mockResolvedValue({ id: "notification_1" }) };
    const service = createService(prisma, notifications);

    const result = await service.createVerifiedPurchaseReview("buyer_1", "product_1", {
      rating: 5,
      comment: "  Excellent product quality and shipping.  ",
      images: [" https://example.com/review.jpg ", ""]
    });

    expect(tx.review.create).toHaveBeenCalledWith({
      data: {
        productId: "product_1",
        buyerId: "buyer_1",
        rating: 5,
        comment: "Excellent product quality and shipping.",
        images: ["https://example.com/review.jpg"],
        status: ReviewStatus.APPROVED
      },
      select: expect.any(Object)
    });
    expect(tx.review.aggregate).toHaveBeenCalledWith({
      where: {
        productId: "product_1",
        status: ReviewStatus.APPROVED
      },
      _avg: { rating: true },
      _count: { rating: true }
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: "product_1" },
      data: {
        averageRating: expect.any(Prisma.Decimal),
        reviewCount: 3
      }
    });
    const ratingUpdate = (tx.product.update as jest.Mock).mock.calls[0][0].data.averageRating as Prisma.Decimal;
    expect(ratingUpdate.toString()).toBe("4.33");
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "buyer_1",
        action: "BUYER_REVIEW_CREATED",
        entity: "Review",
        entityId: "review_1",
        metadata: {
          productId: "product_1",
          orderItemId: "order_item_1",
          orderId: "order_1",
          rating: 5
        }
      }
    });
    expect(notifications.create).toHaveBeenCalledWith({
      userId: "seller_user_1",
      type: NotificationType.ORDER,
      title: "New product review",
      message: "Test Product received a 5-star review.",
      idempotencyKey: "review-created-review_1"
    });
    expect(result).toMatchObject({
      id: "review_1",
      productId: "product_1",
      buyerId: "buyer_1",
      rating: 5,
      verifiedPurchase: true
    });
  });
});

function buildProduct() {
  return {
    id: "product_1",
    title: "Test Product",
    slug: "test-product",
    averageRating: new Prisma.Decimal("0"),
    reviewCount: 0,
    store: {
      id: "store_1",
      name: "Seller Store",
      sellerProfile: {
        userId: "seller_user_1"
      }
    }
  };
}

function buildReview() {
  return {
    id: "review_1",
    productId: "product_1",
    buyerId: "buyer_1",
    rating: 5,
    comment: "Excellent product quality and shipping.",
    images: ["https://example.com/review.jpg"],
    status: ReviewStatus.APPROVED,
    createdAt: new Date("2026-07-11T10:00:00.000Z"),
    updatedAt: new Date("2026-07-11T10:00:00.000Z"),
    buyer: {
      id: "buyer_1",
      fullName: "Buyer One"
    }
  };
}
