import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, Prisma, SellerStatus } from "@prisma/client";
import { createHash } from "node:crypto";
import { EmailQueueService } from "../jobs/email-queue.service";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateSellerOrderFulfillmentDto } from "./dto/update-seller-order-fulfillment.dto";

type SellerOrderFilters = {
  status?: OrderStatus;
};

const sellerManagedStatuses = new Set<OrderStatus>([
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED
]);

@Injectable()
export class SellerOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailQueue: EmailQueueService
  ) {}

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
      items: items.map(formatSellerOrderItem),
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

    return formatSellerOrderItemDetail(item);
  }

  async updateFulfillment(userId: string, itemId: string, dto: UpdateSellerOrderFulfillmentDto) {
    if (!sellerManagedStatuses.has(dto.status)) {
      throw new BadRequestException("Sellers can set paid, processing, shipped, delivered, or cancelled fulfillment status.");
    }

    const trackingNumber = normalizeTrackingNumber(dto.trackingNumber);

    if (dto.status === OrderStatus.SHIPPED && !trackingNumber) {
      throw new BadRequestException("Tracking number is required when marking an item as shipped.");
    }

    const store = await this.findApprovedStore(userId);
    const existingItem = await this.prisma.orderItem.findFirst({
      where: {
        id: itemId,
        storeId: store.id
      },
      select: {
        id: true,
        orderId: true,
        productId: true,
        quantity: true,
        sellerFulfillmentStatus: true,
        trackingNumber: true
      }
    });

    if (!existingItem) {
      throw new NotFoundException("Seller order item was not found.");
    }

    const updatedItem = await this.prisma.$transaction(async (tx) => {
      if (dto.status === OrderStatus.CANCELLED) {
        const cancellation = await tx.orderItem.updateMany({
          where: {
            id: itemId,
            sellerFulfillmentStatus: { not: OrderStatus.CANCELLED }
          },
          data: {
            sellerFulfillmentStatus: OrderStatus.CANCELLED,
            trackingNumber: null
          }
        });

        if (cancellation.count === 1) {
          await tx.product.update({
            where: { id: existingItem.productId },
            data: { stockQuantity: { increment: existingItem.quantity } }
          });
          await tx.inventoryLog.create({
            data: {
              productId: existingItem.productId,
              change: existingItem.quantity,
              reason: "ORDER_ITEM_CANCELLED",
              actorUserId: userId
            }
          });
        }
      } else {
        await tx.orderItem.update({
          where: { id: itemId },
          data: {
            sellerFulfillmentStatus: dto.status,
            trackingNumber
          }
        });
      }

      const nextOrderStatus = await calculateOrderStatus(tx, existingItem.orderId);

      await tx.order.update({
        where: { id: existingItem.orderId },
        data: { status: nextOrderStatus }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: "SELLER_ORDER_FULFILLMENT_UPDATED",
          entity: "OrderItem",
          entityId: itemId,
          metadata: {
            orderId: existingItem.orderId,
            storeId: store.id,
            status: {
              from: existingItem.sellerFulfillmentStatus,
              to: dto.status
            },
            trackingNumber: {
              from: existingItem.trackingNumber,
              to: trackingNumber
            }
          }
        }
      });

      const updatedItem = await tx.orderItem.findUniqueOrThrow({
        where: { id: itemId },
        select: sellerOrderItemDetailSelect
      });

      return formatSellerOrderItemDetail(updatedItem);
    });

    const shippingDetailsChanged =
      existingItem.sellerFulfillmentStatus !== dto.status ||
      existingItem.trackingNumber !== trackingNumber;

    if (
      shippingDetailsChanged &&
      (dto.status === OrderStatus.SHIPPED || dto.status === OrderStatus.DELIVERED)
    ) {
      const changeDigest = createHash("sha256")
        .update(`${dto.status}|${trackingNumber ?? ""}`)
        .digest("hex")
        .slice(0, 16);

      await this.emailQueue.enqueue(`shipping-update-${itemId}-${changeDigest}`, {
        kind: "shipping-update",
        to: updatedItem.buyer.email,
        recipientName: updatedItem.buyer.fullName,
        orderId: updatedItem.order.id,
        orderNumber: updatedItem.order.orderNumber,
        productTitle: updatedItem.productTitle,
        status: dto.status,
        trackingNumber: trackingNumber ?? undefined
      });
    }

    return updatedItem;
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
          createdAt: true
        }
      }
    }
  }
} as const;

type SellerOrderItemListRecord = {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string | null;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  sellerFulfillmentStatus: OrderStatus;
  trackingNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: { id: string; slug: string; status: string };
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    placedAt: Date;
    buyer: { id: string; fullName: string; email: string };
    payment: {
      id: string;
      status: string;
      amountCents: number;
      currency: string;
      provider: string;
    } | null;
  };
};

type SellerOrderItemDetailRecord = SellerOrderItemListRecord & {
  store: { id: string; name: string; slug: string };
  order: SellerOrderItemListRecord["order"] & {
    shippingAddress: unknown;
    buyer: SellerOrderItemListRecord["order"]["buyer"] & { phone: string | null };
    payment: (NonNullable<SellerOrderItemListRecord["order"]["payment"]> & {
      createdAt: Date;
    }) | null;
  };
};

function formatSellerOrderItem(item: SellerOrderItemListRecord) {
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
    order: {
      id: item.order.id,
      orderNumber: item.order.orderNumber,
      status: item.order.status,
      placedAt: item.order.placedAt
    },
    buyer: item.order.buyer,
    payment: item.order.payment
  };
}

function formatSellerOrderItemDetail(item: SellerOrderItemDetailRecord) {
  return {
    ...formatSellerOrderItem(item),
    store: item.store,
    buyer: item.order.buyer,
    payment: item.order.payment,
    shippingAddress: item.order.shippingAddress
  };
}

async function calculateOrderStatus(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { sellerFulfillmentStatus: true }
  });
  const statuses = items.map((item) => item.sellerFulfillmentStatus);

  if (statuses.length > 0 && statuses.every((status) => status === OrderStatus.CANCELLED)) {
    return OrderStatus.CANCELLED;
  }

  if (statuses.length > 0 && statuses.every((status) => status === OrderStatus.DELIVERED)) {
    return OrderStatus.DELIVERED;
  }

  if (statuses.some((status) => status === OrderStatus.SHIPPED)) {
    return OrderStatus.SHIPPED;
  }

  if (statuses.some((status) => status === OrderStatus.PROCESSING)) {
    return OrderStatus.PROCESSING;
  }

  return OrderStatus.PAID;
}

function normalizeOptionalStatus(status?: OrderStatus) {
  if (!status) {
    return undefined;
  }

  if (!Object.values(OrderStatus).includes(status)) {
    throw new BadRequestException("Invalid fulfillment status filter.");
  }

  return status;
}

function normalizeTrackingNumber(value?: string) {
  const normalized = value?.trim() ?? "";

  return normalized || null;
}
