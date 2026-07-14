import { ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OrderStatus, PaymentStatus, ProductStatus, SellerStatus } from "@prisma/client";
import { CartCacheService } from "../cart/cart-cache.service";
import { CheckoutService } from "../checkout/checkout.service";
import { EmailQueueService } from "../jobs/email-queue.service";
import { SellerOrdersService } from "../seller-orders/seller-orders.service";

describe("Inventory and concurrency security", () => {
  it("prevents two paid checkout sessions from buying the same final item", async () => {
    let stockQuantity = 1;
    let ordersCreated = 0;
    const prisma = {
      $transaction: jest.fn((callback: (transaction: ReturnType<typeof createCheckoutTx>) => Promise<unknown>) =>
        callback(createCheckoutTx({
          getStock: () => stockQuantity,
          decrementStock: (quantity) => {
            stockQuantity -= quantity;
          },
          onOrderCreated: () => {
            ordersCreated += 1;
          }
        }))
      )
    };
    const service = createCheckoutService(prisma);
    const firstSession = buildPaidSession("cs_final_item_a", "cart_a", "buyer_a");
    const secondSession = buildPaidSession("cs_final_item_b", "cart_b", "buyer_b");

    const first = await (service as unknown as CheckoutInternals).createOrderFromPaidCheckoutSession(firstSession, "evt_a");
    const second = await Promise.allSettled([
      (service as unknown as CheckoutInternals).createOrderFromPaidCheckoutSession(secondSession, "evt_b")
    ]).then(([result]) => result);

    expect(first).toMatchObject({ action: "order_created" });
    expect(second.status).toBe("rejected");
    if (second.status === "rejected") {
      expect(second.reason).toBeInstanceOf(ConflictException);
    }
    expect(stockQuantity).toBe(0);
    expect(ordersCreated).toBe(1);
    expect(stockQuantity).toBeGreaterThanOrEqual(0);
  });

  it("does not reduce stock for failed payment events", async () => {
    const prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({ id: "payment_1" }),
        update: jest.fn()
      },
      product: { updateMany: jest.fn() },
      inventoryLog: { create: jest.fn() }
    };
    const service = createCheckoutService(prisma);

    const result = await (service as unknown as {
      updateCheckoutSessionPayment: (session: { id: string }, status: PaymentStatus, eventId: string) => Promise<unknown>;
    }).updateCheckoutSessionPayment({ id: "cs_failed" }, PaymentStatus.FAILED, "evt_failed");

    expect(result).toMatchObject({ action: "payment_updated", paymentStatus: PaymentStatus.FAILED });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: { status: PaymentStatus.FAILED, rawEventId: "evt_failed" }
    });
    expect(prisma.product.updateMany).not.toHaveBeenCalled();
    expect(prisma.inventoryLog.create).not.toHaveBeenCalled();
  });

  it("does not reduce stock twice for duplicate paid processing jobs", async () => {
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment_1",
          orderId: "order_1",
          buyerId: "buyer_1",
          amountCents: 1000,
          currency: "USD",
          status: PaymentStatus.PAID
        }),
        update: jest.fn()
      },
      order: { findUniqueOrThrow: jest.fn().mockResolvedValue(buildOrderEmailRecord()), create: jest.fn() },
      product: { updateMany: jest.fn() },
      inventoryLog: { create: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
      cart: { update: jest.fn() }
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const enqueue = jest.fn();
    const service = createCheckoutService(prisma, { enqueue });

    const result = await (service as unknown as CheckoutInternals)
      .createOrderFromPaidCheckoutSession(buildPaidSession("cs_duplicate", "cart_1", "buyer_1"), "evt_duplicate_job");

    expect(result).toMatchObject({ action: "order_already_created", orderId: "order_1" });
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryLog.create).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("restores stock only once when the same seller cancellation is retried", async () => {
    let stockQuantity = 0;
    let itemStatus: OrderStatus = OrderStatus.PAID;
    const tx = {
      orderItem: {
        updateMany: jest.fn(async () => {
          if (itemStatus === OrderStatus.CANCELLED) {
            return { count: 0 };
          }

          itemStatus = OrderStatus.CANCELLED;
          return { count: 1 };
        }),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ sellerFulfillmentStatus: OrderStatus.CANCELLED }]),
        findUniqueOrThrow: jest.fn().mockImplementation(() => Promise.resolve(buildSellerOrderItem(itemStatus)))
      },
      product: {
        update: jest.fn(async ({ data }: { data: { stockQuantity: { increment: number } } }) => {
          stockQuantity += data.stockQuantity.increment;
        })
      },
      inventoryLog: { create: jest.fn() },
      order: { update: jest.fn() },
      auditLog: { create: jest.fn() }
    };
    const prisma = createSellerOrderPrisma(tx, () => itemStatus);
    const service = new SellerOrdersService(
      prisma as never,
      { enqueue: jest.fn() } as unknown as EmailQueueService
    );

    await service.updateFulfillment("seller_user_1", "order_item_1", { status: OrderStatus.CANCELLED });
    await service.updateFulfillment("seller_user_1", "order_item_1", { status: OrderStatus.CANCELLED });

    expect(tx.orderItem.updateMany).toHaveBeenCalledTimes(2);
    expect(tx.product.update).toHaveBeenCalledTimes(1);
    expect(tx.inventoryLog.create).toHaveBeenCalledTimes(1);
    expect(stockQuantity).toBe(1);
    expect(stockQuantity).toBeGreaterThanOrEqual(0);
  });
});

type CheckoutInternals = {
  createOrderFromPaidCheckoutSession: (session: ReturnType<typeof buildPaidSession>, eventId: string) => Promise<unknown>;
};

function createCheckoutService(
  prisma: Record<string, unknown>,
  emailQueue: Partial<EmailQueueService> = {}
) {
  return new CheckoutService(
    prisma as never,
    { invalidate: jest.fn() } as unknown as CartCacheService,
    { enqueue: jest.fn(), ...emailQueue } as unknown as EmailQueueService,
    {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: ["sk", "test", "local"].join("_"),
          STRIPE_WEBHOOK_SECRET: "stripe-webhook-local",
          FRONTEND_URL: "http://localhost:3000"
        };

        return values[key];
      })
    } as unknown as ConfigService
  );
}

function createCheckoutTx(state: {
  getStock: () => number;
  decrementStock: (quantity: number) => void;
  onOrderCreated: () => void;
}) {
  return {
    payment: {
      findUnique: jest.fn(({ where }: { where: { providerRef: string } }) => Promise.resolve({
        id: `payment_${where.providerRef}`,
        orderId: null,
        buyerId: where.providerRef.endsWith("a") ? "buyer_a" : "buyer_b",
        amountCents: 1000,
        currency: "USD",
        status: PaymentStatus.PENDING
      })),
      update: jest.fn()
    },
    cart: {
      findFirst: jest.fn(({ where }: { where: { id: string; userId: string } }) => Promise.resolve(buildCheckoutCart(where.id, where.userId))),
      update: jest.fn()
    },
    address: { findFirst: jest.fn().mockResolvedValue({ id: "address_1", label: "Home", line1: "1 Main", line2: null, city: "City", state: null, country: "US", postalCode: "10001" }) },
    product: {
      updateMany: jest.fn(async ({ where, data }: { where: { stockQuantity: { gte: number } }; data: { stockQuantity: { decrement: number } } }) => {
        if (state.getStock() >= where.stockQuantity.gte) {
          state.decrementStock(data.stockQuantity.decrement);
          return { count: 1 };
        }

        return { count: 0 };
      })
    },
    inventoryLog: { create: jest.fn() },
    order: {
      create: jest.fn(async () => {
        state.onOrderCreated();
        return buildOrderEmailRecord();
      })
    },
    cartItem: { deleteMany: jest.fn() }
  };
}

function buildPaidSession(id: string, cartId: string, buyerId: string) {
  return {
    id,
    payment_status: "paid",
    client_reference_id: cartId,
    metadata: { userId: buyerId, addressId: "address_1" }
  };
}

function buildCheckoutCart(cartId: string, buyerId: string) {
  return {
    id: cartId,
    user: { email: `${buyerId}@example.test` },
    items: [
      {
        quantity: 1,
        product: {
          id: "product_final_item",
          title: "Final Item",
          priceCents: 1000,
          currency: "USD",
          stockQuantity: 1,
          status: ProductStatus.APPROVED,
          category: { isActive: true },
          store: {
            id: "store_1",
            name: "Seller Store",
            status: SellerStatus.APPROVED,
            sellerProfile: { status: SellerStatus.APPROVED }
          },
          images: []
        }
      }
    ]
  };
}

function buildOrderEmailRecord() {
  return {
    id: "order_1",
    orderNumber: "ORD-STOCK",
    totalCents: 1000,
    buyer: { fullName: "Buyer One", email: "buyer@example.com" },
    items: [
      {
        id: "order_item_1",
        quantity: 1,
        totalCents: 1000,
        store: {
          id: "store_1",
          name: "Seller Store",
          sellerProfile: { user: { fullName: "Seller One", email: "seller@example.com" } }
        }
      }
    ]
  };
}

function createSellerOrderPrisma(tx: Record<string, unknown>, getStatus: () => OrderStatus) {
  return {
    sellerProfile: {
      findUnique: jest.fn().mockResolvedValue({
        status: SellerStatus.APPROVED,
        store: { id: "store_1", name: "Seller Store", slug: "seller-store", status: SellerStatus.APPROVED }
      })
    },
    orderItem: {
      findFirst: jest.fn().mockImplementation(() => Promise.resolve({
        id: "order_item_1",
        orderId: "order_1",
        productId: "product_1",
        quantity: 1,
        sellerFulfillmentStatus: getStatus(),
        trackingNumber: null
      }))
    },
    $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
  };
}

function buildSellerOrderItem(status: OrderStatus) {
  return {
    id: "order_item_1",
    productId: "product_1",
    productTitle: "Seller Product",
    productImage: null,
    unitPriceCents: 1000,
    quantity: 1,
    totalCents: 1000,
    sellerFulfillmentStatus: status,
    trackingNumber: null,
    createdAt: new Date("2026-07-01T10:00:00.000Z"),
    updatedAt: new Date("2026-07-01T10:00:00.000Z"),
    product: { id: "product_1", slug: "seller-product", status: ProductStatus.APPROVED },
    store: { id: "store_1", name: "Seller Store", slug: "seller-store" },
    order: {
      id: "order_1",
      orderNumber: "ORD-STOCK",
      status,
      placedAt: new Date("2026-07-01T10:00:00.000Z"),
      shippingAddress: { line1: "1 Main" },
      buyer: { id: "buyer_1", fullName: "Buyer One", email: "buyer@example.com", phone: null },
      payment: { id: "payment_1", status: PaymentStatus.PAID, amountCents: 1000, currency: "USD", provider: "stripe", providerRef: "cs_1", createdAt: new Date("2026-07-01T10:00:00.000Z") }
    }
  };
}
