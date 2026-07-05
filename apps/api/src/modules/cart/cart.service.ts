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
            stockQuantity: true
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
              slug: true
            }
          },
          store: {
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
          }
        }
      }
    }
  }
} as const;

type CartWithItems = Awaited<ReturnType<PrismaService["cart"]["findUniqueOrThrow"]>>;

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
      category: { id: string; name: string; slug: string };
      store: { id: string; name: string; slug: string };
      images: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>;
    };
  }>;
};

function formatCart(cart: SelectedCart) {
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    lineTotalCents: item.quantity * item.product.priceCents,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    product: {
      id: item.product.id,
      title: item.product.title,
      slug: item.product.slug,
      priceCents: item.product.priceCents,
      currency: item.product.currency,
      stockQuantity: item.product.stockQuantity,
      status: item.product.status,
      category: item.product.category,
      store: item.product.store,
      image: item.product.images[0] ?? null
    }
  }));
  const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

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
      totalQuantity
    }
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