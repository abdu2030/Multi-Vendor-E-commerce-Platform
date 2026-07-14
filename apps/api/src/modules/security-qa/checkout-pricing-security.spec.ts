import { BadRequestException, ConflictException, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentStatus, ProductStatus, SellerStatus } from "@prisma/client";
import { createValidationException } from "../../common/validation/validation-errors";
import { CartCacheService } from "../cart/cart-cache.service";
import { AddCartItemDto } from "../cart/dto/add-cart-item.dto";
import { UpdateCartItemDto } from "../cart/dto/update-cart-item.dto";
import { EmailQueueService } from "../jobs/email-queue.service";
import { CheckoutService } from "../checkout/checkout.service";
import { CreateCheckoutSessionDto } from "../checkout/dto/create-checkout-session.dto";

describe("Checkout and pricing security", () => {
  it("rejects frontend-supplied cart prices and totals", async () => {
    const pipe = createSecurityValidationPipe();

    await expect(pipe.transform(
      {
        productId: "cm12345678901234567890123",
        quantity: 1,
        priceCents: 1,
        totalCents: 1
      },
      { type: "body", metatype: AddCartItemDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "priceCents" }),
          expect.objectContaining({ field: "totalCents" })
        ])
      }
    });
  });

  it("rejects negative cart quantity", async () => {
    const pipe = createSecurityValidationPipe();

    await expect(pipe.transform(
      { quantity: -1 },
      { type: "body", metatype: UpdateCartItemDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([expect.objectContaining({ field: "quantity" })])
      }
    });
  });

  it("rejects coupon, shipping, total, and commission fields at checkout", async () => {
    const pipe = createSecurityValidationPipe();

    await expect(pipe.transform(
      {
        addressId: "cm12345678901234567890123",
        couponCode: "EXPIRED10",
        couponCodes: ["SAVE10", "STACKED10"],
        shippingCents: 1,
        subtotalCents: 1,
        totalCents: 1,
        vendorCommissionCents: 1,
        platformCommissionRate: 0
      },
      { type: "body", metatype: CreateCheckoutSessionDto }
    )).rejects.toMatchObject({
      response: {
        errors: expect.arrayContaining([
          expect.objectContaining({ field: "couponCode" }),
          expect.objectContaining({ field: "couponCodes" }),
          expect.objectContaining({ field: "shippingCents" }),
          expect.objectContaining({ field: "subtotalCents" }),
          expect.objectContaining({ field: "totalCents" }),
          expect.objectContaining({ field: "vendorCommissionCents" }),
          expect.objectContaining({ field: "platformCommissionRate" })
        ])
      }
    });
  });

  it("rejects expired coupon attempts because coupons are not client-authoritative inputs", async () => {
    await expect(createSecurityValidationPipe().transform(
      { addressId: "cm12345678901234567890123", couponCode: "EXPIRED" },
      { type: "body", metatype: CreateCheckoutSessionDto }
    )).rejects.toMatchObject({
      response: { errors: expect.arrayContaining([expect.objectContaining({ field: "couponCode" })]) }
    });
  });

  it("rejects coupon usage-limit attempts because coupons are not client-authoritative inputs", async () => {
    await expect(createSecurityValidationPipe().transform(
      { addressId: "cm12345678901234567890123", couponCode: "LIMIT_REACHED" },
      { type: "body", metatype: CreateCheckoutSessionDto }
    )).rejects.toMatchObject({
      response: { errors: expect.arrayContaining([expect.objectContaining({ field: "couponCode" })]) }
    });
  });

  it("rejects incompatible coupon combinations before checkout calculation", async () => {
    await expect(createSecurityValidationPipe().transform(
      { addressId: "cm12345678901234567890123", couponCodes: ["SAVE10", "STACKED10"] },
      { type: "body", metatype: CreateCheckoutSessionDto }
    )).rejects.toMatchObject({
      response: { errors: expect.arrayContaining([expect.objectContaining({ field: "couponCodes" })]) }
    });
  });

  it("creates Stripe line items and payment records from backend product prices only", async () => {
    const cart = buildCheckoutCart({ priceCents: 2500, quantity: 3 });
    const stripeCreate = jest.fn().mockResolvedValue({ id: "cs_backend_price", url: "https://stripe.example.test/session" });
    const prisma = {
      cart: { findFirst: jest.fn().mockResolvedValue(cart) },
      address: { findFirst: jest.fn().mockResolvedValue({ id: "cm12345678901234567890123" }) },
      payment: { create: jest.fn() }
    };
    const service = createCheckoutService(prisma, stripeCreate);

    const result = await service.createCheckoutSession("buyer_1", "cm12345678901234567890123");

    expect(stripeCreate).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [expect.objectContaining({
        quantity: 3,
        price_data: expect.objectContaining({
          unit_amount: 2500,
          currency: "usd"
        })
      })]
    }));
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        buyerId: "buyer_1",
        amountCents: 7500,
        currency: "USD",
        status: PaymentStatus.PENDING
      })
    });
    expect(result).toMatchObject({ amountCents: 7500, currency: "USD" });
  });

  it("refuses to create an order if the recorded payment total differs from the current backend cart total", async () => {
    const cart = buildCheckoutCart({ priceCents: 2000, quantity: 2 });
    const tx = {
      payment: {
        findUnique: jest.fn().mockResolvedValue({
          id: "payment_1",
          orderId: null,
          buyerId: "buyer_1",
          amountCents: 1,
          currency: "USD",
          status: PaymentStatus.PENDING
        })
      },
      cart: { findFirst: jest.fn().mockResolvedValue(cart) },
      address: { findFirst: jest.fn().mockResolvedValue({ id: "address_1" }) },
      product: { updateMany: jest.fn() },
      order: { create: jest.fn() },
      cartItem: { deleteMany: jest.fn() }
    };
    const prisma = {
      $transaction: jest.fn((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
    };
    const service = createCheckoutService(prisma);
    const session = {
      id: "cs_tampered_total",
      client_reference_id: "cart_1",
      metadata: { userId: "buyer_1", addressId: "address_1" }
    };

    await expect((service as unknown as {
      createOrderFromPaidCheckoutSession: (checkoutSession: typeof session, eventId: string) => Promise<unknown>;
    }).createOrderFromPaidCheckoutSession(session, "evt_paid_1")).rejects.toBeInstanceOf(ConflictException);
    expect(tx.product.updateMany).not.toHaveBeenCalled();
    expect(tx.order.create).not.toHaveBeenCalled();
  });

  it("rejects checkout when backend-calculated totals are not positive", async () => {
    const cart = buildCheckoutCart({ priceCents: 0, quantity: 1 });
    const stripeCreate = jest.fn();
    const prisma = {
      cart: { findFirst: jest.fn().mockResolvedValue(cart) },
      address: { findFirst: jest.fn().mockResolvedValue({ id: "cm12345678901234567890123" }) },
      payment: { create: jest.fn() }
    };
    const service = createCheckoutService(prisma, stripeCreate);

    await expect(service.createCheckoutSession("buyer_1", "cm12345678901234567890123"))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(stripeCreate).not.toHaveBeenCalled();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});

function createSecurityValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: createValidationException
  });
}

function createCheckoutService(prisma: Record<string, unknown>, stripeCreate = jest.fn()) {
  const service = new CheckoutService(
    prisma as never,
    { invalidate: jest.fn() } as unknown as CartCacheService,
    { enqueue: jest.fn() } as unknown as EmailQueueService,
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

  (service as unknown as { stripe: unknown }).stripe = {
    checkout: { sessions: { create: stripeCreate } }
  };

  return service;
}

function buildCheckoutCart({ priceCents, quantity }: { priceCents: number; quantity: number }) {
  return {
    id: "cart_1",
    user: { email: "buyer@example.com" },
    items: [
      {
        quantity,
        product: {
          id: "product_1",
          title: "Backend Priced Product",
          priceCents,
          currency: "USD",
          stockQuantity: 10,
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
