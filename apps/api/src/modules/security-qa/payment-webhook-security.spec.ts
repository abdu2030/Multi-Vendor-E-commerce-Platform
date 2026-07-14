import { BadRequestException, ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentStatus } from "@prisma/client";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { CartCacheService } from "../cart/cart-cache.service";
import { CheckoutService } from "../checkout/checkout.service";
import { EmailQueueService } from "../jobs/email-queue.service";

describe("Payment and webhook security", () => {
  it("rejects invalid Stripe webhook signatures before recording events", async () => {
    const prisma = {
      webhookEvent: { findUnique: jest.fn() }
    };
    const service = createCheckoutService(prisma);

    setStripe(service, {
      webhooks: {
        constructEvent: jest.fn(() => {
          throw new Error("bad signature");
        })
      }
    });

    await expect(service.handleStripeWebhook("invalid-signature", Buffer.from("{}")))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.webhookEvent.findUnique).not.toHaveBeenCalled();
  });

  it("safely ignores duplicate webhook events before payment state changes", async () => {
    const prisma = {
      webhookEvent: {
        findUnique: jest.fn().mockResolvedValue({ id: "webhook_1", status: "PROCESSED" }),
        update: jest.fn()
      },
      payment: { update: jest.fn() }
    };
    const service = createCheckoutService(prisma);
    const constructEvent = jest.fn().mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: { id: "cs_duplicate" } }
    });

    setStripe(service, { webhooks: { constructEvent } });

    const result = await service.handleStripeWebhook("stripe-signature", Buffer.from("{}"));

    expect(result).toMatchObject({ duplicate: true, eventId: "evt_duplicate" });
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(prisma.webhookEvent.update).not.toHaveBeenCalled();
  });

  it("does not reduce stock twice when another paid event arrives after order creation", async () => {
    const existingOrder = buildOrderEmailRecord();
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment_1",
          orderId: "order_1",
          buyerId: "buyer_1",
          amountCents: 4000,
          currency: "USD",
          status: PaymentStatus.PAID
        }),
        update: jest.fn()
      },
      order: { findUniqueOrThrow: jest.fn().mockResolvedValue(existingOrder), create: jest.fn() },
      product: { updateMany: jest.fn() },
      inventoryLog: { create: jest.fn() },
      cartItem: { deleteMany: jest.fn() },
      cart: { update: jest.fn() }
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const enqueue = jest.fn().mockResolvedValue(true);
    const service = createCheckoutService(prisma, { enqueue });

    const result = await (service as unknown as {
      createOrderFromPaidCheckoutSession: (session: PaidSessionFixture, eventId: string) => Promise<unknown>;
    }).createOrderFromPaidCheckoutSession(buildPaidSession(), "evt_second_paid");

    expect(result).toMatchObject({ action: "order_already_created", orderId: "order_1" });
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.inventoryLog.create).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
    expect(tx.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("keeps unverified checkout sessions unpaid and does not create orders", async () => {
    const tx = { order: { create: jest.fn() }, product: { updateMany: jest.fn() } };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const retrieve = jest.fn().mockResolvedValue({
      id: "cs_unpaid",
      payment_status: "unpaid",
      client_reference_id: "cart_1",
      metadata: { userId: "buyer_1", addressId: "address_1" }
    });
    const service = createCheckoutService(prisma);

    setStripe(service, { checkout: { sessions: { retrieve } } });

    await expect((service as unknown as {
      createOrderFromVerifiedPaidCheckoutSession: (session: { id: string }, eventId: string) => Promise<unknown>;
    }).createOrderFromVerifiedPaidCheckoutSession({ id: "cs_unpaid" }, "evt_unpaid"))
      .rejects.toBeInstanceOf(ConflictException);
    expect(retrieve).toHaveBeenCalledWith("cs_unpaid");
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects frontend attempts to mark payment or order status as paid", () => {
    const checkoutController = readFileSync(
      path.resolve(process.cwd(), "src/modules/checkout/checkout.controller.ts"),
      "utf8"
    );
    const checkoutDto = readFileSync(
      path.resolve(process.cwd(), "src/modules/checkout/dto/create-checkout-session.dto.ts"),
      "utf8"
    );

    expect(checkoutController).not.toMatch(/mark.*paid|payment.*confirm|confirm.*payment/i);
    expect(checkoutDto).not.toMatch(/paymentStatus|orderStatus|status|paid/i);
  });

  it("does not expose refund or payout mutation endpoints", () => {
    const controllerFiles = getSourceFiles(path.resolve(process.cwd(), "src/modules"))
      .filter((file) => file.endsWith(".controller.ts"));
    const exposedMoneyMutations = controllerFiles.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const matches = Array.from(source.matchAll(/@(Post|Patch|Delete)\(([^)]*)\)/g));

      return matches
        .map((match) => `${path.basename(file)}:${match[1]}:${match[2]}`)
        .filter((route) => /refund|payout/i.test(route));
    });

    expect(exposedMoneyMutations).toEqual([]);
  });
});

type PaidSessionFixture = ReturnType<typeof buildPaidSession>;

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

function setStripe(service: CheckoutService, stripe: unknown) {
  (service as unknown as { stripe: unknown }).stripe = stripe;
}

function buildPaidSession() {
  return {
    id: "cs_paid",
    payment_status: "paid",
    client_reference_id: "cart_1",
    metadata: { userId: "buyer_1", addressId: "address_1" }
  };
}

function buildOrderEmailRecord() {
  return {
    id: "order_1",
    orderNumber: "ORD-PAID",
    totalCents: 4000,
    buyer: { fullName: "Buyer One", email: "buyer@example.com" },
    items: [
      {
        id: "order_item_1",
        quantity: 2,
        totalCents: 4000,
        store: {
          id: "store_1",
          name: "Seller Store",
          sellerProfile: {
            user: { fullName: "Seller One", email: "seller@example.com" }
          }
        }
      }
    ]
  };
}

function getSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const absolute = path.join(root, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      return getSourceFiles(absolute);
    }

    return /\.[cm]?[jt]s$/.test(entry) ? [absolute] : [];
  });
}
