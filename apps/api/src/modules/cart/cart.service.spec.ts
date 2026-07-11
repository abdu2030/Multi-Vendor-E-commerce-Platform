import { ConflictException, NotFoundException } from "@nestjs/common";
import { CartStatus, ProductStatus, SellerStatus } from "@prisma/client";
import { CartCacheService } from "./cart-cache.service";
import { CartService } from "./cart.service";

describe("CartService", () => {
  function createService(prisma: Record<string, unknown>, cache: Partial<CartCacheService> = {}) {
    const resolvedCache = {
      getSummary: jest.fn().mockResolvedValue(null),
      setSummary: jest.fn(),
      getCount: jest.fn().mockResolvedValue(null),
      setCount: jest.fn(),
      invalidate: jest.fn(),
      ...cache
    } as unknown as CartCacheService;

    return {
      cache: resolvedCache,
      service: new CartService(prisma as never, resolvedCache)
    };
  }

  it("returns a cached cart summary without querying Prisma", async () => {
    const cachedSummary = { id: "cart_1", totals: { totalQuantity: 2 } };
    const prisma = { cart: { upsert: jest.fn() } };
    const { service } = createService(prisma, { getSummary: jest.fn().mockResolvedValue(cachedSummary) });

    await expect(service.getCartSummary("buyer_1")).resolves.toBe(cachedSummary);
    expect(prisma.cart.upsert).not.toHaveBeenCalled();
  });

  it("adds quantity to an existing cart item, invalidates cache, and returns recalculated totals", async () => {
    const prisma = {
      cart: {
        upsert: jest.fn().mockResolvedValue({ id: "cart_1" }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(buildSelectedCart({ quantity: 3 }))
      },
      product: {
        findFirst: jest.fn().mockResolvedValue({ id: "product_1", stockQuantity: 5 })
      },
      cartItem: {
        findUnique: jest.fn().mockResolvedValue({ id: "cart_item_1", quantity: 1 }),
        update: jest.fn(),
        create: jest.fn()
      }
    };
    const invalidate = jest.fn();
    const { service } = createService(prisma, { invalidate });

    const result = await service.addItem("buyer_1", { productId: "product_1", quantity: 2 });

    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: "cart_item_1" },
      data: { quantity: 3 }
    });
    expect(prisma.cartItem.create).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith("buyer_1");
    expect(result.totals).toMatchObject({
      subtotalCents: 7500,
      itemCount: 1,
      totalQuantity: 3,
      invalidItemCount: 0,
      hasStockIssues: false,
      currency: "USD"
    });
  });

  it("rejects adding more than available stock", async () => {
    const prisma = {
      cart: { upsert: jest.fn().mockResolvedValue({ id: "cart_1" }) },
      product: { findFirst: jest.fn().mockResolvedValue({ id: "product_1", stockQuantity: 2 }) },
      cartItem: { findUnique: jest.fn().mockResolvedValue({ id: "cart_item_1", quantity: 1 }) }
    };
    const { service, cache } = createService(prisma);

    await expect(service.addItem("buyer_1", { productId: "product_1", quantity: 2 })).rejects.toBeInstanceOf(ConflictException);
    expect(cache.invalidate).not.toHaveBeenCalled();
  });

  it("caches a calculated cart count", async () => {
    const prisma = {
      cart: { upsert: jest.fn().mockResolvedValue({ id: "cart_1" }) },
      cartItem: { aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 4 } }) }
    };
    const setCount = jest.fn();
    const { service } = createService(prisma, { setCount });

    await expect(service.getCartCount("buyer_1")).resolves.toEqual({ totalQuantity: 4 });
    expect(setCount).toHaveBeenCalledWith("buyer_1", 4);
  });

  it("throws when removing a cart item that is not owned by the active cart", async () => {
    const prisma = {
      cart: { findUnique: jest.fn().mockResolvedValue({ id: "cart_1", status: CartStatus.ACTIVE }) },
      cartItem: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) }
    };
    const { service } = createService(prisma);

    await expect(service.removeItem("buyer_1", "missing_item")).rejects.toBeInstanceOf(NotFoundException);
  });
});

function buildSelectedCart(overrides: { quantity?: number } = {}) {
  const quantity = overrides.quantity ?? 2;

  return {
    id: "cart_1",
    userId: "buyer_1",
    status: CartStatus.ACTIVE,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    items: [
      {
        id: "cart_item_1",
        quantity,
        createdAt: new Date("2026-07-01T10:00:00.000Z"),
        updatedAt: new Date("2026-07-01T10:00:00.000Z"),
        product: {
          id: "product_1",
          title: "Test Shoes",
          slug: "test-shoes",
          priceCents: 2500,
          currency: "USD",
          stockQuantity: 5,
          status: ProductStatus.APPROVED,
          category: { id: "category_1", name: "Footwear", slug: "footwear", isActive: true },
          store: {
            id: "store_1",
            name: "Seller Store",
            slug: "seller-store",
            status: SellerStatus.APPROVED,
            sellerProfile: { status: SellerStatus.APPROVED }
          },
          images: [{ id: "image_1", url: "https://example.com/product.jpg", altText: null, sortOrder: 0 }]
        }
      }
    ]
  };
}
