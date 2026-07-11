import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductStatus, SellerStatus } from "@prisma/client";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  it("lists approved public products with filters, pagination, sorting, and formatted output", async () => {
    const product = buildProduct();
    const prisma = {
      product: {
        count: jest.fn(),
        findMany: jest.fn()
      },
      $transaction: jest.fn().mockResolvedValue([1, [product]])
    };
    const service = new ProductsService(prisma as never);

    const result = await service.getAll({
      q: " Shoes ",
      categorySlug: "footwear",
      storeSlug: "seller-store",
      minPriceCents: 1000,
      maxPriceCents: 5000,
      inStock: true,
      sort: "price_asc",
      page: 2,
      limit: 6
    });

    expect(prisma.product.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: ProductStatus.APPROVED,
        priceCents: { gte: 1000, lte: 5000 },
        stockQuantity: { gt: 0 },
        category: expect.objectContaining({ isActive: true, slug: "footwear" }),
        store: expect.objectContaining({
          status: SellerStatus.APPROVED,
          slug: "seller-store",
          sellerProfile: { status: SellerStatus.APPROVED }
        }),
        OR: expect.arrayContaining([
          { title: { contains: "Shoes", mode: "insensitive" } },
          { tags: { has: "shoes" } }
        ])
      })
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: [{ priceCents: "asc" }, { createdAt: "desc" }],
      skip: 6,
      take: 6
    }));
    expect(result).toMatchObject({
      items: [{
        id: "product_1",
        averageRating: 4.5,
        image: { id: "image_1", url: "https://example.com/product.jpg" },
        counts: { variants: 2, reviews: 3 }
      }],
      meta: {
        page: 2,
        limit: 6,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: true,
        sort: "price_asc"
      }
    });
  });

  it("rejects an invalid price range", async () => {
    const service = new ProductsService({} as never);

    await expect(service.getAll({
      minPriceCents: 5000,
      maxPriceCents: 1000,
      sort: "newest",
      page: 1,
      limit: 12
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("loads a public product detail by slug", async () => {
    const product = { ...buildProduct(), variants: [{ id: "variant_1", name: "Size", value: "42", sku: null, priceDeltaCents: 0, stockQuantity: 2 }] };
    const prisma = {
      product: {
        findFirst: jest.fn().mockResolvedValue(product)
      }
    };
    const service = new ProductsService(prisma as never);

    const result = await service.getOneBySlug("test-shoes");

    expect(prisma.product.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ slug: "test-shoes", status: ProductStatus.APPROVED })
    }));
    expect(result).toMatchObject({
      id: "product_1",
      images: [{ id: "image_1", url: "https://example.com/product.jpg" }],
      variants: [{ id: "variant_1", name: "Size", value: "42" }]
    });
  });

  it("throws when a product slug is not publicly visible", async () => {
    const service = new ProductsService({ product: { findFirst: jest.fn().mockResolvedValue(null) } } as never);

    await expect(service.getOneBySlug("missing-product")).rejects.toBeInstanceOf(NotFoundException);
  });
});

function buildProduct() {
  return {
    id: "product_1",
    title: "Test Shoes",
    slug: "test-shoes",
    description: "Comfortable shoes",
    priceCents: 2500,
    currency: "USD",
    stockQuantity: 5,
    tags: ["shoes"],
    averageRating: 4.5,
    reviewCount: 3,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    category: { id: "category_1", name: "Footwear", slug: "footwear" },
    store: { id: "store_1", name: "Seller Store", slug: "seller-store", logoUrl: null },
    images: [{ id: "image_1", url: "https://example.com/product.jpg", altText: null, sortOrder: 0 }],
    _count: { variants: 2, reviews: 3 }
  };
}
