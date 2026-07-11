import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductStatus } from "@prisma/client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService
  ) {}

  getPending() {
    return this.prisma.product.findMany({
      where: { status: ProductStatus.PENDING_REVIEW },
      orderBy: { updatedAt: "asc" },
      select: adminProductListSelect
    });
  }

  async getOne(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: adminProductDetailSelect
    });

    if (!product) {
      throw new NotFoundException("Product was not found.");
    }

    return product;
  }

  async approve(productId: string, adminUserId: string) {
    const product = await this.findProductOrThrow(productId);

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new ConflictException("Only pending review products can be approved.");
    }

    const [approvedProduct] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatus.APPROVED },
        select: adminProductDetailSelect
      }),
      this.auditLogs.create({
        actorUserId: adminUserId,
        action: "PRODUCT_APPROVED",
        entity: "Product",
        entityId: product.id,
        metadata: {
          previousStatus: product.status,
          newStatus: ProductStatus.APPROVED,
          storeId: product.storeId,
          sellerUserId: product.store.sellerProfile.userId
        }
      })
    ]);

    return approvedProduct;
  }

  async reject(productId: string, adminUserId: string, reason: string) {
    const product = await this.findProductOrThrow(productId);

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new ConflictException("Only pending review products can be rejected.");
    }

    const cleanReason = reason.trim();

    const [rejectedProduct] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: product.id },
        data: { status: ProductStatus.REJECTED },
        select: adminProductDetailSelect
      }),
      this.auditLogs.create({
        actorUserId: adminUserId,
        action: "PRODUCT_REJECTED",
        entity: "Product",
        entityId: product.id,
        metadata: {
          previousStatus: product.status,
          newStatus: ProductStatus.REJECTED,
          reason: cleanReason,
          storeId: product.storeId,
          sellerUserId: product.store.sellerProfile.userId
        }
      })
    ]);

    return rejectedProduct;
  }

  private async findProductOrThrow(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        storeId: true,
        status: true,
        store: {
          select: {
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

const adminProductListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceCents: true,
  currency: true,
  stockQuantity: true,
  status: true,
  tags: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      sellerProfile: {
        select: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  },
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: {
      id: true,
      url: true,
      altText: true,
      sortOrder: true
    }
  }
} as const;

const adminProductDetailSelect = {
  ...adminProductListSelect,
  images: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      url: true,
      publicId: true,
      altText: true,
      sortOrder: true,
      createdAt: true
    }
  },
  variants: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      value: true,
      sku: true,
      priceDeltaCents: true,
      stockQuantity: true,
      createdAt: true,
      updatedAt: true
    }
  }
} as const;
