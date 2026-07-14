import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateAdminOrderStatusDto } from "./dto/update-admin-order-status.dto";

type AdminOrderFilters = {
  status?: OrderStatus;
};

@Injectable()
export class AdminOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService
  ) {}

  async getAll(filters: AdminOrderFilters) {
    const status = normalizeOptionalStatus(filters.status);
    const orders = await this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { placedAt: "desc" },
      select: adminOrderListSelect
    });

    return {
      orders: orders.map(formatAdminOrderListItem),
      total: orders.length
    };
  }

  async getOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: adminOrderDetailSelect
    });

    if (!order) {
      throw new NotFoundException("Order was not found.");
    }

    return formatAdminOrderDetail(order);
  }

  async updateStatus(orderId: string, adminUserId: string, dto: UpdateAdminOrderStatusDto) {
    const nextStatus = normalizeOptionalStatus(dto.status);

    if (!nextStatus) {
      throw new BadRequestException("Order status is required.");
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        buyerId: true,
        status: true,
        items: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            sellerFulfillmentStatus: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException("Order was not found.");
    }

    const reason = dto.reason?.trim() || null;

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      if (nextStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          const cancellation = await tx.orderItem.updateMany({
            where: {
              id: item.id,
              sellerFulfillmentStatus: { not: OrderStatus.CANCELLED }
            },
            data: { sellerFulfillmentStatus: OrderStatus.CANCELLED }
          });

          if (cancellation.count === 1) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } }
            });
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                change: item.quantity,
                reason: "ORDER_CANCELLED",
                actorUserId: adminUserId
              }
            });
          }
        }
      } else {
        await tx.orderItem.updateMany({
          where: { orderId },
          data: { sellerFulfillmentStatus: nextStatus }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        select: adminOrderDetailSelect
      });

      await this.auditLogs.create({
        actorUserId: adminUserId,
        action: "ORDER_STATUS_UPDATED",
        entity: "Order",
        entityId: orderId,
        metadata: {
          orderNumber: order.orderNumber,
          buyerId: order.buyerId,
          previousStatus: order.status,
          newStatus: nextStatus,
          reason
        }
      }, tx);

      return updatedOrder;
    });

    return formatAdminOrderDetail(updatedOrder);
  }
}

const adminOrderListSelect = {
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
  buyer: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true
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

const adminOrderDetailSelect = {
  ...adminOrderListSelect,
  shippingAddress: true,
  updatedAt: true,
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
      providerRef: true,
      amountCents: true,
      currency: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  }
} as const;

type AdminOrderListRecord = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: Date;
  createdAt: Date;
  buyer: { id: string; fullName: string; email: string; phone: string | null };
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

type AdminOrderDetailRecord = AdminOrderListRecord & {
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
    sellerFulfillmentStatus: OrderStatus;
    trackingNumber: string | null;
    product: { id: string; slug: string; status: string };
    store: { id: string; name: string; slug: string };
  }>;
  payment: {
    id: string;
    provider: string;
    providerRef: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

function formatAdminOrderListItem(order: AdminOrderListRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totals: formatTotals(order),
    placedAt: order.placedAt,
    createdAt: order.createdAt,
    buyer: order.buyer,
    itemCount: order._count.items,
    payment: order.payment
  };
}

function formatAdminOrderDetail(order: AdminOrderDetailRecord) {
  return {
    ...formatAdminOrderListItem(order),
    shippingAddress: order.shippingAddress,
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

function normalizeOptionalStatus(status?: OrderStatus) {
  if (!status) {
    return undefined;
  }

  if (!Object.values(OrderStatus).includes(status)) {
    throw new BadRequestException("Invalid order status.");
  }

  return status;
}
