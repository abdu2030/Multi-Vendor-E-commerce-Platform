import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, SellerStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type SellerOrderFilters = {
  status?: OrderStatus;
};

@Injectable()
export class SellerOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: string, filters: SellerOrderFilters) {
    const store = await this.findApprovedStore(userId);
    const status = normalizeOptionalStatus(filters.status);
    const items = await this.prisma.orderItem.findMany({
      where: {
        storeId: store.id,
        ...(status ? { sellerFulfillmentStatus: status } : {})
      },
      orderBy: [{ order: { placedAt: "desc" } }, { createdAt: "desc" }],
      select: sellerOrderItemListSelect
    });
    const totalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const orderIds = new Set(items.map((item) => item.order.id));

    return {
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug
      },
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productTitle: item.productTitle,
        productImage: item.productImage,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        totalCents: item.totalCents,
        sellerFulfillmentStatus: item.sellerFulfillmentStatus,
        trackingNumber: item.trackingNumber,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: item.product,
        order: item.order,
        buyer: item.order.buyer,
        payment: item.order.payment
      })),
      metrics: {
        orderItems: items.length,
        orders: orderIds.size,
        totalQuantity,
        totalCents,
        currency: items[0]?.order.payment?.currency ?? "USD"
      }
    };
  }

  async getOne(userId: string, itemId: string) {
    const store = await this.findApprovedStore(userId);
    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: itemId,
        storeId: store.id
      },
      select: sellerOrderItemDetailSelect
    });

    if (!item) {
      throw new NotFoundException("Seller order item was not found.");
    }

    return {
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle,
      productImage: item.productImage,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      totalCents: item.totalCents,
      sellerFulfillmentStatus: item.sellerFulfillmentStatus,
      trackingNumber: item.trackingNumber,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      product: item.product,
      store: item.store,
      order: item.order,
      buyer: item.order.buyer,
      payment: item.order.payment,
      shippingAddress: item.order.shippingAddress
    };
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
      throw new ForbiddenException("Seller store must be approved before viewing orders.");
    }

    return sellerProfile.store;
  }
}

const sellerOrderItemListSelect = {
  id: true,
  productId: true,
  productTitle: true,
  productImage: true,
  unitPriceCents: true,
  quantity: true,
  totalCents: true,
  sellerFulfillmentStatus: true,
  trackingNumber: true,
  createdAt: true,
  updatedAt: true,
  product: {
    select: {
      id: true,
      slug: true,
      status: true
    }
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      placedAt: true,
      buyer: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      payment: {
        select: {
          id: true,
          status: true,
          amountCents: true,
          currency: true,
          provider: true
        }
      }
    }
  }
} as const;

const sellerOrderItemDetailSelect = {
  ...sellerOrderItemListSelect,
  store: {
    select: {
      id: true,
      name: true,
      slug: true
    }
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      shippingAddress: true,
      placedAt: true,
      buyer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true
        }
      },
      payment: {
        select: {
          id: true,
          status: true,
          amountCents: true,
          currency: true,
          provider: true,
          providerRef: true,
          createdAt: true
        }
      }
    }
  }
} as const;

function normalizeOptionalStatus(status?: OrderStatus) {
  if (!status) {
    return undefined;
  }

  if (!Object.values(OrderStatus).includes(status)) {
    throw new BadRequestException("Invalid fulfillment status filter.");
  }

  return status;
}
