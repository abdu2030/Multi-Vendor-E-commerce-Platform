import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listBuyerOrders(buyerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerId },
      orderBy: { placedAt: "desc" },
      select: orderListSelect
    });

    return {
      orders: orders.map(formatOrderListItem),
      total: orders.length
    };
  }

  async getBuyerOrder(buyerId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId },
      select: orderDetailSelect
    });

    if (!order) {
      throw new NotFoundException("Order was not found.");
    }

    return formatOrderDetail(order);
  }
}

const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotalCents: true,
  shippingCents: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  placedAt: true,
  createdAt: true,
  items: {
    orderBy: { createdAt: "asc" },
    take: 3,
    select: {
      id: true,
      productTitle: true,
      productImage: true,
      quantity: true,
      totalCents: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  _count: {
    select: { items: true }
  },
  payment: {
    select: {
      id: true,
      provider: true,
      status: true,
      amountCents: true,
      currency: true,
      createdAt: true
    }
  }
} as const;

const orderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  subtotalCents: true,
  shippingCents: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  shippingAddress: true,
  placedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { items: true }
  },
  items: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      productId: true,
      productTitle: true,
      productImage: true,
      unitPriceCents: true,
      quantity: true,
      totalCents: true,
      sellerFulfillmentStatus: true,
      trackingNumber: true,
      product: {
        select: {
          id: true,
          slug: true,
          status: true
        }
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  payment: {
    select: {
      id: true,
      provider: true,
      amountCents: true,
      currency: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  }
} as const;

type OrderListRecord = {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: Date;
  createdAt: Date;
  items: Array<{
    id: string;
    productTitle: string;
    productImage: string | null;
    quantity: number;
    totalCents: number;
    store: { id: string; name: string; slug: string };
  }>;
  _count: { items: number };
  payment: {
    id: string;
    provider: string;
    status: string;
    amountCents: number;
    currency: string;
    createdAt: Date;
  } | null;
};

type OrderDetailRecord = OrderListRecord & {
  shippingAddress: unknown;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    productTitle: string;
    productImage: string | null;
    unitPriceCents: number;
    quantity: number;
    totalCents: number;
    sellerFulfillmentStatus: string;
    trackingNumber: string | null;
    product: { id: string; slug: string; status: string };
    store: { id: string; name: string; slug: string };
  }>;
  payment: {
    id: string;
    provider: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

function formatOrderListItem(order: OrderListRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totals: formatTotals(order),
    placedAt: order.placedAt,
    createdAt: order.createdAt,
    itemCount: order._count.items,
    previewItems: order.items,
    payment: order.payment
  };
}

function formatOrderDetail(order: OrderDetailRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totals: formatTotals(order),
    shippingAddress: order.shippingAddress,
    placedAt: order.placedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items,
    itemCount: order.items.length,
    payment: order.payment
  };
}

function formatTotals(order: {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  payment: { currency: string } | null;
}) {
  return {
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    currency: order.payment?.currency ?? "USD"
  };
}
