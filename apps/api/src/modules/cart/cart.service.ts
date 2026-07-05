import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { CartStatus, ProductStatus, SellerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateActiveCart(userId);

    return this.findCartById(cart.id);
  }

  async getCartSummary(userId: string) {
    const cart = await this.getOrCreateActiveCart(userId);

    return this.findCartById(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const [cart, product] = await Promise.all([
      this.getOrCreateActiveCart(userId),
      this.findPurchasableProduct(dto.productId)
    ]);
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id
        }
      },
      select: { id: true, quantity: true }
    });
    const nextQuantity = (existingItem?.quantity ?? 0) + dto.quantity;

    assertStockAvailable(product.stockQuantity, nextQuantity);

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: nextQuantity }
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: dto.quantity
        }
      });
    }

    return this.findCartById(cart.id);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getActiveCartOrThrow(userId);
    const item = await this.findOwnedCartItem(cart.id, itemId);

    assertCartItemStillPurchasable(item.product);
    assertStockAvailable(item.product.stockQuantity, dto.quantity);

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity }
    });

    return this.findCartById(cart.id);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getActiveCartOrThrow(userId);
    const result = await this.prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        cartId: cart.id
      }
    });

    if (result.count === 0) {
      throw new NotFoundException("Cart item was not found.");
    }

    return this.findCartById(cart.id);
  }

  async clearCart(userId: string) {
    const cart = await this.getActiveCartOrThrow(userId);

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return this.findCartById(cart.id);
  }

  private getOrCreateActiveCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: {
        userId,
        status: CartStatus.ACTIVE
      },
      update: {
        status: CartStatus.ACTIVE
      },
      select: { id: true }
    });
  }

  private async getActiveCartOrThrow(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true, status: true }
    });

    if (!cart || cart.status !== CartStatus.ACTIVE) {
      throw new NotFoundException("Active cart was not found.");
    }

    return cart;
  }

  private async findPurchasableProduct(productId: string) {
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
        stockQuantity: true
      }
    });

    if (!product) {
      throw new NotFoundException("Product was not found or is not available for purchase.");
    }

    if (product.stockQuantity < 1) {
      throw new ConflictException("Product is out of stock.");
    }

    return product;
  }

  private async findOwnedCartItem(cartId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId
      },
      select: {
        id: true,
        product: {
          select: {
            status: true,
            stockQuantity: true,
            category: {
              select: { isActive: true }
            },
            store: {
              select: {
                status: true,
                sellerProfile: {
                  select: { status: true }
                }
              }
            }
          }
        }
      }
    });

    if (!item) {
      throw new NotFoundException("Cart item was not found.");
    }

    return item;
  }

  private async findCartById(cartId: string) {
    const cart = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      select: cartSelect
    });

    return formatCart(cart);
  }
}

const cartSelect = {
  id: true,
  userId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          priceCents: true,
          currency: true,
          stockQuantity: true,
          status: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              sellerProfile: {
                select: {
                  status: true
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
        }
      }
    }
  }
} as const;

type SelectedCart = {
  id: string;
  userId: string;
  status: CartStatus;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    product: {
      id: string;
      title: string;
      slug: string;
      priceCents: number;
      currency: string;
      stockQuantity: number;
      status: ProductStatus;
      category: { id: string; name: string; slug: string; isActive: boolean };
      store: {
        id: string;
        name: string;
        slug: string;
        status: SellerStatus;
        sellerProfile: { status: SellerStatus };
      };
      images: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>;
    };
  }>;
};

function formatCart(cart: SelectedCart) {
  const recalculatedAt = new Date();
  const items = cart.items.map((item) => {
    const validation = getCartItemValidation(item);
    const unitPriceCents = item.product.priceCents;
    const lineTotalCents = item.quantity * unitPriceCents;

    return {
      id: item.id,
      quantity: item.quantity,
      lineTotalCents,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        priceCents: unitPriceCents,
        currency: item.product.currency,
        stockQuantity: item.product.stockQuantity,
        status: item.product.status,
        category: {
          id: item.product.category.id,
          name: item.product.category.name,
          slug: item.product.category.slug
        },
        store: {
          id: item.product.store.id,
          name: item.product.store.name,
          slug: item.product.store.slug
        },
        image: item.product.images[0] ?? null
      },
      pricing: {
        unitPriceCents,
        lineTotalCents,
        currency: item.product.currency,
        recalculatedAt
      },
      stock: {
        requestedQuantity: item.quantity,
        availableQuantity: item.product.stockQuantity,
        isInStock: item.product.stockQuantity > 0,
        hasEnoughStock: item.quantity <= item.product.stockQuantity
      },
      validation
    };
  });
  const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const invalidItemCount = items.filter((item) => !item.validation.isPurchasable).length;
  const hasStockIssues = items.some((item) =>
    item.validation.issues.some((issue) => issue.code === "INSUFFICIENT_STOCK" || issue.code === "OUT_OF_STOCK")
  );

  return {
    id: cart.id,
    userId: cart.userId,
    status: cart.status,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items,
    totals: {
      subtotalCents,
      itemCount: items.length,
      totalQuantity,
      invalidItemCount,
      hasStockIssues,
      currency: items[0]?.product.currency ?? null,
      recalculatedAt
    }
  };
}

function getCartItemValidation(item: SelectedCart["items"][number]) {
  const issues: Array<{ code: string; message: string }> = [];

  if (item.product.status !== ProductStatus.APPROVED) {
    issues.push({
      code: "PRODUCT_UNAVAILABLE",
      message: "Product is no longer approved for purchase."
    });
  }

  if (!item.product.category.isActive) {
    issues.push({
      code: "CATEGORY_INACTIVE",
      message: "Product category is currently inactive."
    });
  }

  if (item.product.store.status !== SellerStatus.APPROVED) {
    issues.push({
      code: "STORE_UNAVAILABLE",
      message: "Store is no longer approved for selling."
    });
  }

  if (item.product.store.sellerProfile.status !== SellerStatus.APPROVED) {
    issues.push({
      code: "SELLER_UNAVAILABLE",
      message: "Seller account is no longer approved."
    });
  }

  if (item.product.stockQuantity < 1) {
    issues.push({
      code: "OUT_OF_STOCK",
      message: "Product is out of stock."
    });
  } else if (item.quantity > item.product.stockQuantity) {
    issues.push({
      code: "INSUFFICIENT_STOCK",
      message: "Requested quantity exceeds available stock."
    });
  }

  return {
    isPurchasable: issues.length === 0,
    issues
  };
}

function assertStockAvailable(stockQuantity: number, requestedQuantity: number) {
  if (requestedQuantity < 1) {
    throw new BadRequestException("Quantity must be at least one.");
  }

  if (requestedQuantity > stockQuantity) {
    throw new ConflictException("Requested quantity exceeds available stock.");
  }
}

function assertCartItemStillPurchasable(product: {
  status: ProductStatus;
  stockQuantity: number;
  category: { isActive: boolean };
  store: { status: SellerStatus; sellerProfile: { status: SellerStatus } };
}) {
  if (
    product.status !== ProductStatus.APPROVED ||
    !product.category.isActive ||
    product.store.status !== SellerStatus.APPROVED ||
    product.store.sellerProfile.status !== SellerStatus.APPROVED
  ) {
    throw new ConflictException("Product is no longer available for purchase.");
  }
}
