import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, ProductStatus, SellerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListProductsQueryDto, ProductSort } from "./dto/list-products-query.dto";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: ListProductsQueryDto) {
    validatePriceRange(query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;
    const where = buildPublicProductWhere(query);
    const orderBy = buildProductOrderBy(query.sort ?? "newest");

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: publicProductSelect
      })
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      items: products.map(formatPublicProduct),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        sort: query.sort ?? "newest"
      }
    };
  }
}

const publicProductSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  priceCents: true,
  currency: true,
  stockQuantity: true,
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
      logoUrl: true
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
      reviews: true
    }
  }
} as const;

type PublicProduct = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;

function buildPublicProductWhere(query: ListProductsQueryDto): Prisma.ProductWhereInput {
  const search = query.q?.trim();
  const priceCents: Prisma.IntFilter = {};

  if (typeof query.minPriceCents !== "undefined") {
    priceCents.gte = query.minPriceCents;
  }

  if (typeof query.maxPriceCents !== "undefined") {
    priceCents.lte = query.maxPriceCents;
  }

  return {
    status: ProductStatus.APPROVED,
    category: {
      isActive: true,
      ...(query.categoryId ? { id: query.categoryId } : {}),
      ...(query.categorySlug ? { slug: query.categorySlug } : {})
    },
    store: {
      status: SellerStatus.APPROVED,
      ...(query.storeId ? { id: query.storeId } : {}),
      ...(query.storeSlug ? { slug: query.storeSlug } : {}),
      sellerProfile: {
        status: SellerStatus.APPROVED
      }
    },
    ...(Object.keys(priceCents).length ? { priceCents } : {}),
    ...(query.inStock ? { stockQuantity: { gt: 0 } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search.toLowerCase() } },
            { category: { name: { contains: search, mode: "insensitive" } } },
            { store: { name: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };
}

function buildProductOrderBy(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  const newestFirst: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

  if (sort === "oldest") {
    return [{ createdAt: "asc" }];
  }

  if (sort === "price_asc") {
    return [{ priceCents: "asc" }, newestFirst];
  }

  if (sort === "price_desc") {
    return [{ priceCents: "desc" }, newestFirst];
  }

  if (sort === "rating_desc") {
    return [{ averageRating: "desc" }, { reviewCount: "desc" }, newestFirst];
  }

  return [newestFirst];
}

function formatPublicProduct(product: PublicProduct) {
  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    currency: product.currency,
    stockQuantity: product.stockQuantity,
    tags: product.tags,
    averageRating: Number(product.averageRating),
    reviewCount: product.reviewCount,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    category: product.category,
    store: product.store,
    image: product.images[0] ?? null,
    counts: {
      variants: product._count.variants,
      reviews: product._count.reviews
    }
  };
}

function validatePriceRange(query: ListProductsQueryDto) {
  if (
    typeof query.minPriceCents !== "undefined" &&
    typeof query.maxPriceCents !== "undefined" &&
    query.minPriceCents > query.maxPriceCents
  ) {
    throw new BadRequestException("Minimum price cannot be greater than maximum price.");
  }
}
