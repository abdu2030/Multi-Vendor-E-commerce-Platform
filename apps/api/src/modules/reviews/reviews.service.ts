import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { NotificationType, OrderStatus, Prisma, ProductStatus, ReviewStatus, SellerStatus } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

const reviewableOrderStatuses = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED
];

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async listForProduct(productId: string) {
    const product = await this.findPublicProduct(productId);
    const reviews = await this.prisma.review.findMany({
      where: {
        productId: product.id,
        status: ReviewStatus.APPROVED
      },
      orderBy: { createdAt: "desc" },
      select: reviewSelect
    });

    return {
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        averageRating: Number(product.averageRating),
        reviewCount: product.reviewCount
      },
      reviews: reviews.map(formatReview),
      total: reviews.length
    };
  }

  async createVerifiedPurchaseReview(buyerId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.findPublicProduct(productId);
    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          buyerId,
          status: { in: reviewableOrderStatuses }
        }
      },
      select: {
        id: true,
        orderId: true
      }
    });

    if (!purchase) {
      throw new ForbiddenException("Only verified buyers can review this product.");
    }

    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_buyerId: {
          productId: product.id,
          buyerId
        }
      },
      select: { id: true }
    });

    if (existingReview) {
      throw new ConflictException("You have already reviewed this product.");
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          productId: product.id,
          buyerId,
          rating: dto.rating,
          comment: dto.comment.trim(),
          images: normalizeImages(dto.images),
          status: ReviewStatus.APPROVED
        },
        select: reviewSelect
      });

      await recalculateProductRating(tx, product.id);
      await tx.auditLog.create({
        data: {
          actorUserId: buyerId,
          action: "BUYER_REVIEW_CREATED",
          entity: "Review",
          entityId: createdReview.id,
          metadata: {
            productId: product.id,
            orderItemId: purchase.id,
            orderId: purchase.orderId,
            rating: dto.rating
          }
        }
      });

      return createdReview;
    });

    await this.notifications.create({
      userId: product.store.sellerProfile.userId,
      type: NotificationType.ORDER,
      title: "New product review",
      message: `${product.title} received a ${dto.rating}-star review.`,
      idempotencyKey: `review-created-${review.id}`
    });

    return formatReview(review);
  }

  private async findPublicProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: ProductStatus.APPROVED,
        category: { isActive: true },
        store: {
          status: SellerStatus.APPROVED,
          sellerProfile: { status: SellerStatus.APPROVED }
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        averageRating: true,
        reviewCount: true,
        store: {
          select: {
            id: true,
            name: true,
            sellerProfile: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException("Product was not found.");
    }

    return product;
  }
}

const reviewSelect = {
  id: true,
  productId: true,
  buyerId: true,
  rating: true,
  comment: true,
  images: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  buyer: {
    select: {
      id: true,
      fullName: true
    }
  }
} as const;

type ReviewRecord = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;

function formatReview(review: ReviewRecord) {
  return {
    id: review.id,
    productId: review.productId,
    buyerId: review.buyerId,
    rating: review.rating,
    comment: review.comment,
    images: review.images,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    buyer: review.buyer,
    verifiedPurchase: true
  };
}

async function recalculateProductRating(tx: Prisma.TransactionClient, productId: string) {
  const aggregate = await tx.review.aggregate({
    where: {
      productId,
      status: ReviewStatus.APPROVED
    },
    _avg: { rating: true },
    _count: { rating: true }
  });
  const averageRating = aggregate._avg.rating ?? 0;
  const reviewCount = aggregate._count.rating;

  await tx.product.update({
    where: { id: productId },
    data: {
      averageRating: new Prisma.Decimal(averageRating.toFixed(2)),
      reviewCount
    }
  });
}

function normalizeImages(images?: string[]) {
  return (images ?? []).map((image) => image.trim()).filter(Boolean);
}
