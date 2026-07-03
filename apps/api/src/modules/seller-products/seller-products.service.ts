import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductStatus, SellerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSellerProductDto } from "./dto/create-seller-product.dto";
import { ProductImageInputDto } from "./dto/product-image-input.dto";
import { ProductVariantInputDto } from "./dto/product-variant-input.dto";
import { UpdateSellerProductDto } from "./dto/update-seller-product.dto";

const sellerEditableStatuses = new Set<ProductStatus>([
  ProductStatus.DRAFT,
  ProductStatus.PENDING_REVIEW,
  ProductStatus.ARCHIVED
]);

type ProductFilters = {
  status?: ProductStatus;
  categoryId?: string;
};

@Injectable()
export class SellerProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: string, filters: ProductFilters) {
    const store = await this.findApprovedStore(userId);
    const status = normalizeOptionalStatus(filters.status);

    return this.prisma.product.findMany({
      where: {
        storeId: store.id,
        ...(status ? { status } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {})
      },
      orderBy: { updatedAt: "desc" },
      select: productListSelect
    });
  }

  async getOne(userId: string, productId: string) {
    const product = await this.findOwnedProduct(userId, productId);

    return product;
  }

  async create(userId: string, dto: CreateSellerProductDto) {
    const [store] = await Promise.all([
      this.findApprovedStore(userId),
      this.findActiveCategory(dto.categoryId)
    ]);
    const title = dto.title.trim();
    const slug = await this.createUniqueProductSlug(dto.slug?.trim() || title);
    const stockQuantity = dto.stockQuantity;
    const images = normalizeImages(dto.images);
    const variants = normalizeVariants(dto.variants);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId: store.id,
          categoryId: dto.categoryId,
          title,
          slug,
          description: dto.description.trim(),
          priceCents: dto.priceCents,
          currency: normalizeCurrency(dto.currency),
          stockQuantity,
          tags: normalizeTags(dto.tags),
          ...(images.length ? { images: { create: images } } : {}),
          ...(variants.length ? { variants: { create: variants } } : {})
        },
        select: productDetailSelect
      });

      if (stockQuantity > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            change: stockQuantity,
            reason: "Initial product stock",
            actorUserId: userId
          }
        });
      }

      for (const variant of product.variants) {
        if (variant.stockQuantity > 0) {
          await tx.inventoryLog.create({
            data: {
              productId: product.id,
              variantId: variant.id,
              change: variant.stockQuantity,
              reason: `Initial variant stock: ${variant.name} ${variant.value}`,
              actorUserId: userId
            }
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SELLER_PRODUCT_CREATED",
          entity: "Product",
          entityId: product.id,
          metadata: {
            storeId: store.id,
            title: product.title,
            status: product.status
          }
        }
      });

      return tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: productDetailSelect
      });
    });
  }

  async update(userId: string, productId: string, dto: UpdateSellerProductDto) {
    const existingProduct = await this.findOwnedProduct(userId, productId);

    if (dto.categoryId) {
      await this.findActiveCategory(dto.categoryId);
    }

    if (dto.status && !sellerEditableStatuses.has(dto.status)) {
      throw new ForbiddenException("Sellers can only set draft, pending review, or archived status.");
    }

    const productChanges = buildProductChanges(existingProduct, dto);
    const data: {
      categoryId?: string;
      title?: string;
      slug?: string;
      description?: string;
      priceCents?: number;
      currency?: string;
      stockQuantity?: number;
      status?: ProductStatus;
      tags?: string[];
    } = {};

    if (typeof dto.categoryId !== "undefined") {
      data.categoryId = dto.categoryId;
    }

    if (typeof dto.title !== "undefined") {
      data.title = dto.title.trim();
    }

    if (typeof dto.slug !== "undefined") {
      data.slug = await this.createUniqueProductSlug(dto.slug.trim(), productId);
    }

    if (typeof dto.description !== "undefined") {
      data.description = dto.description.trim();
    }

    if (typeof dto.priceCents !== "undefined") {
      data.priceCents = dto.priceCents;
    }

    if (typeof dto.currency !== "undefined") {
      data.currency = normalizeCurrency(dto.currency);
    }

    if (typeof dto.stockQuantity !== "undefined") {
      data.stockQuantity = dto.stockQuantity;
    }

    if (typeof dto.status !== "undefined") {
      data.status = dto.status;
    }

    if (typeof dto.tags !== "undefined") {
      data.tags = normalizeTags(dto.tags);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data
      });

      if (typeof dto.images !== "undefined") {
        const images = normalizeImages(dto.images);

        await tx.productImage.deleteMany({ where: { productId } });

        if (images.length) {
          await tx.productImage.createMany({
            data: images.map((image) => ({
              ...image,
              productId
            }))
          });
        }
      }

      if (typeof dto.variants !== "undefined") {
        const variants = normalizeVariants(dto.variants);

        await tx.productVariant.deleteMany({ where: { productId } });

        if (variants.length) {
          await tx.productVariant.createMany({
            data: variants.map((variant) => ({
              ...variant,
              productId
            }))
          });
        }
      }

      if (
        typeof dto.stockQuantity !== "undefined" &&
        dto.stockQuantity !== existingProduct.stockQuantity
      ) {
        await tx.inventoryLog.create({
          data: {
            productId,
            change: dto.stockQuantity - existingProduct.stockQuantity,
            reason: "Seller product stock update",
            actorUserId: userId
          }
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SELLER_PRODUCT_UPDATED",
          entity: "Product",
          entityId: productId,
          metadata: {
            changes: productChanges
          }
        }
      });

      return tx.product.findUniqueOrThrow({
        where: { id: productId },
        select: productDetailSelect
      });
    });
  }

  async archive(userId: string, productId: string) {
    await this.findOwnedProduct(userId, productId);

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: { status: ProductStatus.ARCHIVED },
        select: productDetailSelect
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SELLER_PRODUCT_ARCHIVED",
          entity: "Product",
          entityId: productId,
          metadata: {
            status: ProductStatus.ARCHIVED
          }
        }
      });

      return product;
    });
  }

  private async findApprovedStore(userId: string) {
    const sellerProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { store: true }
    });

    if (!sellerProfile || !sellerProfile.store) {
      throw new NotFoundException("Store was not found for this seller account.");
    }

    if (
      sellerProfile.status !== SellerStatus.APPROVED ||
      sellerProfile.store.status !== SellerStatus.APPROVED
    ) {
      throw new ForbiddenException("Seller store must be approved before managing products.");
    }

    return sellerProfile.store;
  }

  private async findOwnedProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: productDetailSelect
    });

    if (!product) {
      throw new NotFoundException("Product was not found.");
    }

    if (product.store.sellerProfile.userId !== userId) {
      throw new NotFoundException("Product was not found.");
    }

    return product;
  }

  private async findActiveCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true }
    });

    if (!category) {
      throw new NotFoundException("Category was not found.");
    }

    if (!category.isActive) {
      throw new ConflictException("Products can only be assigned to active categories.");
    }

    return category;
  }

  private async createUniqueProductSlug(value: string, excludeId?: string) {
    const baseSlug = slugify(value);
    let slug = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.product.findFirst({
        where: {
          slug,
          ...(excludeId ? { id: { not: excludeId } } : {})
        },
        select: { id: true }
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }
}

const productListSelect = {
  id: true,
  title: true,
  slug: true,
  priceCents: true,
  currency: true,
  stockQuantity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true
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
  },
  _count: {
    select: {
      variants: true,
      orderItems: true,
      reviews: true
    }
  }
} as const;

const productDetailSelect = {
  id: true,
  storeId: true,
  categoryId: true,
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
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
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

type ProductChangeValue = string | number | string[] | ProductStatus | null | undefined;
type ProductChangeSet = Record<
  string,
  { from: ProductChangeValue; to: ProductChangeValue }
>;

function buildProductChanges(
  product: typeof productDetailSelect extends infer _T ? {
    categoryId: string;
    title: string;
    slug: string;
    description: string;
    priceCents: number;
    currency: string;
    stockQuantity: number;
    status: ProductStatus;
    tags: string[];
  } : never,
  dto: UpdateSellerProductDto
) {
  const changes: ProductChangeSet = {};
  const nextValues = {
    categoryId: dto.categoryId,
    title: dto.title?.trim(),
    slug: dto.slug?.trim(),
    description: dto.description?.trim(),
    priceCents: dto.priceCents,
    currency: typeof dto.currency === "undefined" ? undefined : normalizeCurrency(dto.currency),
    stockQuantity: dto.stockQuantity,
    status: dto.status,
    tags: typeof dto.tags === "undefined" ? undefined : normalizeTags(dto.tags)
  };

  for (const [field, value] of Object.entries(nextValues)) {
    if (typeof value === "undefined") {
      continue;
    }

    const previous = product[field as keyof typeof nextValues] as ProductChangeValue;
    const changed = Array.isArray(previous) || Array.isArray(value)
      ? JSON.stringify(previous) !== JSON.stringify(value)
      : previous !== value;

    if (changed) {
      changes[field] = { from: previous, to: value };
    }
  }

  return changes;
}

function normalizeImages(images?: ProductImageInputDto[]) {
  return (images ?? []).map((image, index) => ({
    url: image.url.trim(),
    publicId: image.publicId?.trim() || null,
    altText: image.altText?.trim() || null,
    sortOrder: image.sortOrder ?? index
  }));
}

function normalizeVariants(variants?: ProductVariantInputDto[]) {
  return (variants ?? []).map((variant) => ({
    name: variant.name.trim(),
    value: variant.value.trim(),
    sku: variant.sku?.trim() || null,
    priceDeltaCents: variant.priceDeltaCents ?? 0,
    stockQuantity: variant.stockQuantity ?? 0
  }));
}

function normalizeTags(tags?: string[]) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function normalizeCurrency(currency?: string) {
  return (currency?.trim() || "USD").toUpperCase();
}

function normalizeOptionalStatus(status?: ProductStatus) {
  if (!status) {
    return undefined;
  }

  if (!Object.values(ProductStatus).includes(status)) {
    throw new BadRequestException("Invalid product status filter.");
  }

  return status;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "product";
}
