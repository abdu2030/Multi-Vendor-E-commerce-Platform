import { ConfigService } from "@nestjs/config";
import { CartStatus, OrderStatus, PaymentStatus, ProductStatus, SellerStatus } from "@prisma/client";
import { CartCacheService } from "../cart/cart-cache.service";
import { EmailQueueService } from "../jobs/email-queue.service";
import { CheckoutService } from "./checkout.service";

describe("CheckoutService webhook order handling", () => {
  function createService(
    prisma: Record<string, unknown>,
    cartCache: Partial<CartCacheService> = {},
    emailQueue: Partial<EmailQueueService> = {}
  ) {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: "sk_test_local",
          STRIPE_WEBHOOK_SECRET: "whsec_local",
          FRONTEND_URL: "http://localhost:3000"
        };

        return values[key];
      })
    } as unknown as ConfigService;

    return new CheckoutService(
      prisma as never,
      { invalidate: jest.fn(), ...cartCache } as unknown as CartCacheService,
      { enqueue: jest.fn(), ...emailQueue } as unknown as EmailQueueService,
      config
    );
  }

  it("skips processing when the webhook event was already processed", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue({ id: "webhook_1", status: "PROCESSED" }),
        update: jest.fn()
      }
    };
    const service = createService(prisma);
    const processStripeWebhookEvent = jest.fn();

    (service as unknown as { constructStripeWebhookEvent: jest.Mock }).constructStripeWebhookEvent = jest.fn().mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: {} }
    });
    (service as unknown as { processStripeWebhookEvent: jest.Mock }).processStripeWebhookEvent = processStripeWebhookEvent;

    const result = await service.handleStripeWebhook("stripe-signature", Buffer.from("{}"));

    expect(result).toEqual({
      received: true,
      duplicate: true,
      eventId: "evt_duplicate",
      eventType: "checkout.session.completed"
    });
    expect(processStripeWebhookEvent).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).not.toHaveBeenCalled();
  });

  it("creates an order once, reduces stock, writes inventory logs, and clears the cart", async () => {
    const invalidate = jest.fn();
    const enqueue = jest.fn().mockResolvedValue(true);
    const cart = buildCheckoutCart();
    const address = {
      id: "address_1",
      label: "Home",
      line1: "123 Market Street",
      line2: null,
      city: "Addis Ababa",
      state: null,
      country: "ET",
      postalCode: "1000"
    };
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment_1",
          orderId: null,
          buyerId: "buyer_1",
          amountCents: 4000,
          currency: "USD",
          status: PaymentStatus.PENDING
        }),
        update: jest.fn()
      },
      cart: {
        findFirst: jest.fn().mockResolvedValue(cart),
        update: jest.fn()
      },
      address: {
        findFirst: jest.fn().mockResolvedValue(address)
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      inventoryLog: {
        create: jest.fn()
      },
      order: {
        create: jest.fn().mockResolvedValue({
          id: "order_1",
          orderNumber: "ORD-TEST",
          totalCents: 4000,
          buyer: {
            fullName: "Buyer One",
            email: "buyer@example.com"
          },
          items: [{
            id: "order_item_1",
            quantity: 2,
            totalCents: 4000,
            store: {
              id: "store_1",
              name: "Seller Store",
              sellerProfile: {
                user: {
                  fullName: "Seller One",
                  email: "seller@example.com"
                }
              }
            }
          }]
        })
      },
      cartItem: {
        deleteMany: jest.fn()
      }
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const service = createService(prisma, { invalidate }, { enqueue });
    const session = {
      id: "cs_test_1",
      client_reference_id: "cart_1",
      metadata: {
        userId: "buyer_1",
        addressId: "address_1"
      }
    };

    const result = await (service as unknown as {
      createOrderFromPaidCheckoutSession: (checkoutSession: typeof session, eventId: string) => Promise<unknown>;
    }).createOrderFromPaidCheckoutSession(session, "evt_paid_1");

    expect(result).toMatchObject({
      action: "order_created",
      orderId: "order_1",
      itemCount: 1,
      totalCents: 4000,
      sessionId: "cs_test_1"
    });
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: "product_1",
        stockQuantity: { gte: 2 }
      },
      data: {
        stockQuantity: { decrement: 2 }
      }
    });
    expect(tx.inventoryLog.create).toHaveBeenCalledWith({
      data: {
        productId: "product_1",
        change: -2,
        reason: "ORDER_PAID",
        actorUserId: "buyer_1"
      }
    });
    expect(tx.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        buyerId: "buyer_1",
        status: OrderStatus.PAID,
        subtotalCents: 4000,
        totalCents: 4000,
        items: {
          create: [expect.objectContaining({
            productId: "product_1",
            storeId: "store_1",
            quantity: 2,
            totalCents: 4000,
            sellerFulfillmentStatus: OrderStatus.PAID
          })]
        }
      })
    }));
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: "payment_1" },
      data: {
        orderId: "order_1",
        status: PaymentStatus.PAID,
        rawEventId: "evt_paid_1"
      }
    });
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: "cart_1" } });
    expect(tx.cart.update).toHaveBeenCalledWith({
      where: { id: "cart_1" },
      data: { status: CartStatus.ACTIVE }
    });
    expect(invalidate).toHaveBeenCalledWith("buyer_1");
    expect(enqueue).toHaveBeenCalledWith(
      "order-confirmation-order_1",
      expect.objectContaining({
        kind: "order-confirmation",
        to: "buyer@example.com",
        orderNumber: "ORD-TEST",
        itemCount: 2,
        totalCents: 4000
      })
    );
    expect(enqueue).toHaveBeenCalledWith(
      "seller-new-order-order_1-store_1",
      expect.objectContaining({
        kind: "seller-new-order",
        to: "seller@example.com",
        storeName: "Seller Store",
        itemCount: 2,
        totalCents: 4000
      })
    );
  });

  it("rejects paid checkout when inventory cannot be decremented", async () => {
    const invalidate = jest.fn();
    const enqueue = jest.fn();
    const cart = buildCheckoutCart();
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment_1",
          orderId: null,
          buyerId: "buyer_1",
          amountCents: 4000,
          currency: "USD",
          status: PaymentStatus.PENDING
        })
      },
      cart: {
        findFirst: jest.fn().mockResolvedValue(cart)
      },
      address: {
        findFirst: jest.fn().mockResolvedValue({
          id: "address_1",
          label: "Home",
          line1: "123 Market Street",
          line2: null,
          city: "Addis Ababa",
          state: null,
          country: "ET",
          postalCode: "1000"
        })
      },
      product: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 })
      },
      inventoryLog: { create: jest.fn() },
      order: { create: jest.fn() },
      cartItem: { deleteMany: jest.fn() }
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const service = createService(prisma, { invalidate }, { enqueue });
    const session = {
      id: "cs_test_1",
      client_reference_id: "cart_1",
      metadata: {
        userId: "buyer_1",
        addressId: "address_1"
      }
    };

    await expect((service as unknown as {
      createOrderFromPaidCheckoutSession: (checkoutSession: typeof session, eventId: string) => Promise<unknown>;
    }).createOrderFromPaidCheckoutSession(session, "evt_paid_1")).rejects.toThrow("Insufficient inventory for Test Shoes.");
    expect(tx.inventoryLog.create).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });
});

function buildCheckoutCart() {
  return {
    id: "cart_1",
    user: {
      email: "buyer@example.com"
    },
    items: [
      {
        quantity: 2,
        product: {
          id: "product_1",
          title: "Test Shoes",
          priceCents: 2000,
          currency: "USD",
          stockQuantity: 5,
          status: ProductStatus.APPROVED,
          category: { isActive: true },
          store: {
            id: "store_1",
            name: "Seller Store",
            status: SellerStatus.APPROVED,
            sellerProfile: { status: SellerStatus.APPROVED }
          },
          images: [{ url: "https://example.com/product.jpg" }]
        }
      }
    ]
  };
}
