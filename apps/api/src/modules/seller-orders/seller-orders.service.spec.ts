import { OrderStatus, SellerStatus } from "@prisma/client";
import { EmailQueueService } from "../jobs/email-queue.service";
import { SellerOrdersService } from "./seller-orders.service";

describe("SellerOrdersService", () => {
  it("queries only order items for the authenticated seller store", async () => {
    const prisma = {
      sellerProfile: {
        findUnique: jest.fn().mockResolvedValue({
          status: SellerStatus.APPROVED,
          store: {
            id: "store_seller_1",
            name: "Seller One",
            slug: "seller-one",
            status: SellerStatus.APPROVED
          }
        })
      },
      orderItem: {
        findMany: jest.fn().mockResolvedValue([
          buildSellerOrderItem({ id: "order_item_1", storeId: "store_seller_1" })
        ])
      }
    };
    const service = new SellerOrdersService(
      prisma as never,
      { enqueue: jest.fn() } as unknown as EmailQueueService
    );

    const result = await service.getAll("seller_user_1", {});

    expect(prisma.sellerProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: "seller_user_1" },
      include: { store: true }
    });
    expect(prisma.orderItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { storeId: "store_seller_1" }
    }));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: "order_item_1",
      productTitle: "Seller Product",
      buyer: {
        id: "buyer_1",
        email: "buyer@example.com"
      }
    });
  });

  it("keeps seller fulfillment updates scoped to the seller store", async () => {
    const enqueue = jest.fn().mockResolvedValue(true);
    const tx = {
      orderItem: {
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ sellerFulfillmentStatus: OrderStatus.SHIPPED }]),
        findUniqueOrThrow: jest.fn().mockResolvedValue(buildSellerOrderItem({ id: "order_item_1", storeId: "store_seller_1", trackingNumber: "TRACK123" }))
      },
      order: {
        update: jest.fn()
      },
      auditLog: {
        create: jest.fn()
      }
    };
    const prisma = {
      sellerProfile: {
        findUnique: jest.fn().mockResolvedValue({
          status: SellerStatus.APPROVED,
          store: {
            id: "store_seller_1",
            name: "Seller One",
            slug: "seller-one",
            status: SellerStatus.APPROVED
          }
        })
      },
      orderItem: {
        findFirst: jest.fn().mockResolvedValue({
          id: "order_item_1",
          orderId: "order_1",
          sellerFulfillmentStatus: OrderStatus.PAID,
          trackingNumber: null
        })
      },
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const service = new SellerOrdersService(
      prisma as never,
      { enqueue } as unknown as EmailQueueService
    );

    await service.updateFulfillment("seller_user_1", "order_item_1", {
      status: OrderStatus.SHIPPED,
      trackingNumber: "TRACK123"
    });

    expect(prisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: {
        id: "order_item_1",
        storeId: "store_seller_1"
      },
      select: {
        id: true,
        orderId: true,
        sellerFulfillmentStatus: true,
        trackingNumber: true
      }
    });
    expect(tx.orderItem.update).toHaveBeenCalledWith({
      where: { id: "order_item_1" },
      data: {
        sellerFulfillmentStatus: OrderStatus.SHIPPED,
        trackingNumber: "TRACK123"
      }
    });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: "order_1" },
      data: { status: OrderStatus.SHIPPED }
    });
    expect(enqueue).toHaveBeenCalledWith(
      expect.stringMatching(/^shipping-update-order_item_1-/),
      expect.objectContaining({
        kind: "shipping-update",
        to: "buyer@example.com",
        orderNumber: "ORD-TEST",
        productTitle: "Seller Product",
        status: OrderStatus.SHIPPED,
        trackingNumber: "TRACK123"
      })
    );
  });
});

function buildSellerOrderItem({
  id,
  storeId,
  trackingNumber = null
}: {
  id: string;
  storeId: string;
  trackingNumber?: string | null;
}) {
  return {
    id,
    productId: "product_1",
    productTitle: "Seller Product",
    productImage: "https://example.com/product.jpg",
    unitPriceCents: 2500,
    quantity: 1,
    totalCents: 2500,
    sellerFulfillmentStatus: trackingNumber ? OrderStatus.SHIPPED : OrderStatus.PAID,
    trackingNumber,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    product: {
      id: "product_1",
      slug: "seller-product",
      status: "APPROVED"
    },
    store: {
      id: storeId,
      name: "Seller One",
      slug: "seller-one"
    },
    order: {
      id: "order_1",
      orderNumber: "ORD-TEST",
      status: OrderStatus.PAID,
      placedAt: new Date("2026-07-01T10:00:00.000Z"),
      shippingAddress: { line1: "123 Market Street" },
      buyer: {
        id: "buyer_1",
        fullName: "Buyer One",
        email: "buyer@example.com",
        phone: null
      },
      payment: {
        id: "payment_1",
        status: "PAID",
        amountCents: 2500,
        currency: "USD",
        provider: "stripe",
        providerRef: "cs_test_1",
        createdAt: new Date("2026-07-01T10:00:00.000Z")
      }
    }
  };
}
