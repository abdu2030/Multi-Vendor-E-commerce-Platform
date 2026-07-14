import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CartStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
  SellerStatus
} from "@prisma/client";
import Stripe from "stripe";
import { CartCacheService } from "../cart/cart-cache.service";
import { EmailQueueService } from "../jobs/email-queue.service";
import { PrismaService } from "../prisma/prisma.service";

const WEBHOOK_PROVIDER = "stripe";
const WEBHOOK_STATUS_FAILED = "FAILED";
const WEBHOOK_STATUS_PROCESSED = "PROCESSED";
const WEBHOOK_STATUS_PROCESSING = "PROCESSING";

@Injectable()
export class CheckoutService {
  private readonly stripe: Stripe | null;
  private readonly frontendUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartCache: CartCacheService,
    private readonly emailQueue: EmailQueueService,
    config: ConfigService
  ) {
    const secretKey = config.get<string>("STRIPE_SECRET_KEY")?.trim();

    this.stripe = secretKey ? new Stripe(secretKey) : null;
    this.frontendUrl = normalizeUrl(config.get<string>("FRONTEND_URL") ?? "http://localhost:3000");
    this.webhookSecret = config.get<string>("STRIPE_WEBHOOK_SECRET")?.trim() ?? "";
  }

  async createCheckoutSession(userId: string, addressId: string) {
    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured.");
    }

    const [cart, address] = await Promise.all([
      this.findCheckoutCart(userId),
      this.findCheckoutAddress(userId, addressId)
    ]);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Add at least one item to the cart before checkout.");
    }

    if (cart.items.length > 100) {
      throw new BadRequestException("Stripe Checkout supports up to 100 line items per session.");
    }

    const currencies = new Set(cart.items.map((item) => item.product.currency.toLowerCase()));

    if (currencies.size !== 1) {
      throw new ConflictException("Checkout cannot contain multiple currencies.");
    }

    const invalidItems = cart.items.filter((item) => !isPurchasableCartItem(item));

    if (invalidItems.length > 0) {
      throw new ConflictException("Resolve unavailable or out-of-stock cart items before checkout.");
    }

    const currency = cart.items[0].product.currency.toLowerCase();
    const amountCents = cart.items.reduce(
      (total, item) => total + item.product.priceCents * item.quantity,
      0
    );

    if (amountCents < 1) {
      throw new BadRequestException("Cart total must be greater than zero before checkout.");
    }

    const checkoutMetadata = {
      cartId: cart.id,
      userId,
      addressId: address.id
    };
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: cart.id,
      customer_email: cart.user.email,
      line_items: cart.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency,
          unit_amount: item.product.priceCents,
          product_data: {
            name: item.product.title,
            description: item.product.store.name,
            images: getStripeImages(item.product.images),
            metadata: {
              productId: item.product.id,
              storeId: item.product.store.id
            }
          }
        }
      })),
      success_url: `${this.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/checkout?checkout=cancelled`,
      metadata: checkoutMetadata,
      payment_intent_data: {
        metadata: checkoutMetadata
      }
    });

    await this.prisma.payment.create({
      data: {
        buyerId: userId,
        provider: "stripe",
        providerRef: session.id,
        amountCents,
        currency: currency.toUpperCase(),
        status: PaymentStatus.PENDING
      }
    });

    return {
      sessionId: session.id,
      url: session.url,
      amountCents,
      currency: currency.toUpperCase(),
      addressId: address.id
    };
  }

  async handleStripeWebhook(signature: string | undefined, rawBody: Buffer | undefined) {
    if (!this.stripe) {
      throw new ServiceUnavailableException("Stripe is not configured.");
    }

    if (!this.webhookSecret) {
      throw new ServiceUnavailableException("Stripe webhook secret is not configured.");
    }

    if (!signature) {
      throw new BadRequestException("Missing Stripe signature header.");
    }

    if (!rawBody) {
      throw new BadRequestException("Missing raw Stripe webhook body.");
    }

    const event = this.constructStripeWebhookEvent(rawBody, signature);
    const gate = await this.beginWebhookEvent(event);

    if (gate.duplicate) {
      return {
        received: true,
        duplicate: true,
        eventId: event.id,
        eventType: event.type
      };
    }

    try {
      const result = await this.processStripeWebhookEvent(event);
      await this.prisma.webhookEvent.update({
        where: { id: gate.id },
        data: {
          status: WEBHOOK_STATUS_PROCESSED,
          processedAt: new Date(),
          failureReason: null
        }
      });

      return {
        received: true,
        duplicate: false,
        eventId: event.id,
        eventType: event.type,
        result
      };
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: gate.id },
        data: {
          status: WEBHOOK_STATUS_FAILED,
          failureReason: getErrorMessage(error)
        }
      });

      throw error;
    }
  }

  private constructStripeWebhookEvent(rawBody: Buffer, signature: string) {
    try {
      return this.stripe!.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      throw new BadRequestException("Invalid Stripe webhook signature.");
    }
  }

  private async beginWebhookEvent(event: Stripe.Event) {
    const existing = await this.prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: WEBHOOK_PROVIDER,
          eventId: event.id
        }
      }
    });

    if (existing?.status === WEBHOOK_STATUS_PROCESSED || existing?.status === WEBHOOK_STATUS_PROCESSING) {
      return { duplicate: true, id: existing.id };
    }

    if (existing) {
      const retry = await this.prisma.webhookEvent.update({
        where: { id: existing.id },
        data: {
          eventType: event.type,
          status: WEBHOOK_STATUS_PROCESSING,
          attemptCount: { increment: 1 },
          failureReason: null
        }
      });

      return { duplicate: false, id: retry.id };
    }

    try {
      const created = await this.prisma.webhookEvent.create({
        data: {
          provider: WEBHOOK_PROVIDER,
          eventId: event.id,
          eventType: event.type,
          status: WEBHOOK_STATUS_PROCESSING
        }
      });

      return { duplicate: false, id: created.id };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const duplicate = await this.prisma.webhookEvent.findUniqueOrThrow({
          where: {
            provider_eventId: {
              provider: WEBHOOK_PROVIDER,
              eventId: event.id
            }
          }
        });

        return { duplicate: true, id: duplicate.id };
      }

      throw error;
    }
  }

  private async processStripeWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.async_payment_failed":
        return this.updateCheckoutSessionPayment(
          event.data.object as Stripe.Checkout.Session,
          PaymentStatus.FAILED,
          event.id
        );
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.completed":
        return this.createOrderFromVerifiedPaidCheckoutSession(event.data.object as Stripe.Checkout.Session, event.id);
      case "checkout.session.expired":
        return this.updateCheckoutSessionPayment(
          event.data.object as Stripe.Checkout.Session,
          PaymentStatus.EXPIRED,
          event.id
        );
      default:
        return { action: "ignored" };
    }
  }

  private async updateCheckoutSessionPayment(
    session: Stripe.Checkout.Session,
    status: PaymentStatus,
    eventId: string
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerRef: session.id },
      select: { id: true }
    });

    if (!payment) {
      return { action: "payment_not_found", sessionId: session.id };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        rawEventId: eventId
      }
    });

    return {
      action: "payment_updated",
      sessionId: session.id,
      paymentStatus: status
    };
  }

  private async createOrderFromVerifiedPaidCheckoutSession(session: Stripe.Checkout.Session, eventId: string) {
    const verifiedSession = await this.retrievePaidCheckoutSession(session.id);

    return this.createOrderFromPaidCheckoutSession(verifiedSession, eventId);
  }

  private async retrievePaidCheckoutSession(sessionId: string) {
    const verifiedSession = await this.stripe!.checkout.sessions.retrieve(sessionId);

    if (verifiedSession.payment_status !== "paid") {
      throw new ConflictException("Stripe checkout session is not paid.");
    }

    return verifiedSession;
  }

  private async createOrderFromPaidCheckoutSession(session: Stripe.Checkout.Session, eventId: string) {
    const cartId = session.client_reference_id ?? session.metadata?.cartId;
    const buyerId = session.metadata?.userId;
    const addressId = session.metadata?.addressId;

    if (!cartId || !buyerId || !addressId) {
      throw new BadRequestException("Stripe checkout session is missing order metadata.");
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { providerRef: session.id },
        select: {
          id: true,
          orderId: true,
          buyerId: true,
          amountCents: true,
          currency: true,
          status: true
        }
      });

      if (!payment) {
        return { action: "payment_not_found", sessionId: session.id };
      }

      if (payment.orderId) {
        const existingOrder = await tx.order.findUniqueOrThrow({
          where: { id: payment.orderId },
          select: orderEmailSelect
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            rawEventId: eventId
          }
        });

        return {
          action: "order_already_created",
          orderId: payment.orderId,
          sessionId: session.id,
          emailContext: buildOrderEmailContext(existingOrder, payment.currency)
        };
      }

      if (payment.buyerId !== buyerId) {
        throw new ConflictException("Stripe payment buyer does not match checkout metadata.");
      }

      const [cart, address] = await Promise.all([
        this.findOrderCart(tx, cartId, buyerId),
        this.findOrderAddress(tx, addressId, buyerId)
      ]);

      if (!cart || cart.items.length === 0) {
        throw new ConflictException("Cannot create an order from an empty cart.");
      }

      if (!address) {
        throw new ConflictException("Cannot create an order without a valid shipping address.");
      }

      const currencies = new Set(cart.items.map((item) => item.product.currency));

      if (currencies.size !== 1) {
        throw new ConflictException("Order cannot contain multiple currencies.");
      }

      const currency = cart.items[0].product.currency;
      const subtotalCents = cart.items.reduce(
        (total, item) => total + item.product.priceCents * item.quantity,
        0
      );

      if (payment.amountCents !== subtotalCents || payment.currency !== currency) {
        throw new ConflictException("Stripe payment amount does not match the current cart total.");
      }

      for (const item of cart.items) {
        assertOrderItemPurchasable(item);

        const update = await tx.product.updateMany({
          where: {
            id: item.product.id,
            stockQuantity: { gte: item.quantity }
          },
          data: {
            stockQuantity: { decrement: item.quantity }
          }
        });

        if (update.count !== 1) {
          throw new ConflictException(`Insufficient inventory for ${item.product.title}.`);
        }

        await tx.inventoryLog.create({
          data: {
            productId: item.product.id,
            change: -item.quantity,
            reason: "ORDER_PAID",
            actorUserId: buyerId
          }
        });
      }

      const order = await tx.order.create({
        data: {
          buyerId,
          orderNumber: generateOrderNumber(),
          status: OrderStatus.PAID,
          subtotalCents,
          totalCents: subtotalCents,
          shippingAddress: snapshotAddress(address),
          items: {
            create: cart.items.map((item) => ({
              productId: item.product.id,
              storeId: item.product.store.id,
              productTitle: item.product.title,
              productImage: item.product.images[0]?.url ?? null,
              unitPriceCents: item.product.priceCents,
              quantity: item.quantity,
              totalCents: item.product.priceCents * item.quantity,
              sellerFulfillmentStatus: OrderStatus.PAID
            }))
          }
        },
        select: orderEmailSelect
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          orderId: order.id,
          status: PaymentStatus.PAID,
          rawEventId: eventId
        }
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { status: CartStatus.ACTIVE }
      });

      return {
        action: "order_created",
        orderId: order.id,
        orderNumber: order.orderNumber,
        itemCount: order.items.length,
        totalCents: order.totalCents,
        sessionId: session.id,
        emailContext: buildOrderEmailContext(order, currency)
      };
    });

    if (result.action === "order_created" && result.emailContext) {
      await this.cartCache.invalidate(buyerId);
      await this.enqueueOrderEmails(result.emailContext);
      const { emailContext: _emailContext, ...response } = result;
      return response;
    }

    if (result.action === "order_already_created" && result.emailContext) {
      const { emailContext: _emailContext, ...response } = result;
      return response;
    }

    return result;
  }

  private async enqueueOrderEmails(context: OrderEmailContext) {
    await Promise.all([
      this.emailQueue.enqueue(`order-confirmation-${context.orderId}`, {
        kind: "order-confirmation",
        to: context.buyer.email,
        recipientName: context.buyer.fullName,
        orderId: context.orderId,
        orderNumber: context.orderNumber,
        itemCount: context.itemCount,
        totalCents: context.totalCents,
        currency: context.currency
      }),
      ...context.sellers.map((seller) =>
        this.emailQueue.enqueue(`seller-new-order-${context.orderId}-${seller.storeId}`, {
          kind: "seller-new-order",
          to: seller.email,
          recipientName: seller.fullName,
          orderId: context.orderId,
          orderNumber: context.orderNumber,
          storeName: seller.storeName,
          itemCount: seller.itemCount,
          totalCents: seller.totalCents,
          currency: context.currency
        })
      )
    ]);
  }

  private findCheckoutCart(userId: string) {
    return this.prisma.cart.findFirst({
      where: {
        userId,
        status: CartStatus.ACTIVE
      },
      select: checkoutCartSelect
    });
  }

  private async findCheckoutAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
      select: { id: true }
    });

    if (!address) {
      throw new BadRequestException("Select a valid shipping address before checkout.");
    }

    return address;
  }

  private findOrderCart(tx: Prisma.TransactionClient, cartId: string, userId: string) {
    return tx.cart.findFirst({
      where: {
        id: cartId,
        userId
      },
      select: checkoutCartSelect
    });
  }

  private findOrderAddress(tx: Prisma.TransactionClient, addressId: string, userId: string) {
    return tx.address.findFirst({
      where: { id: addressId, userId },
      select: addressSnapshotSelect
    });
  }
}

const orderEmailSelect = {
  id: true,
  orderNumber: true,
  totalCents: true,
  buyer: {
    select: {
      fullName: true,
      email: true
    }
  },
  items: {
    select: {
      id: true,
      quantity: true,
      totalCents: true,
      store: {
        select: {
          id: true,
          name: true,
          sellerProfile: {
            select: {
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  }
} as const;

const checkoutCartSelect = {
  id: true,
  user: {
    select: {
      email: true
    }
  },
  items: {
    orderBy: { createdAt: "asc" },
    select: {
      quantity: true,
      product: {
        select: {
          id: true,
          title: true,
          priceCents: true,
          currency: true,
          stockQuantity: true,
          status: true,
          category: {
            select: { isActive: true }
          },
          store: {
            select: {
              id: true,
              name: true,
              status: true,
              sellerProfile: {
                select: { status: true }
              }
            }
          },
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true }
          }
        }
      }
    }
  }
} as const;

const addressSnapshotSelect = {
  id: true,
  label: true,
  line1: true,
  line2: true,
  city: true,
  state: true,
  country: true,
  postalCode: true
} as const;

type CheckoutCart = NonNullable<Awaited<ReturnType<CheckoutService["findCheckoutCart"]>>>;
type CheckoutCartItem = CheckoutCart["items"][number];
type AddressSnapshot = Prisma.AddressGetPayload<{ select: typeof addressSnapshotSelect }>;
type OrderEmailRecord = Prisma.OrderGetPayload<{ select: typeof orderEmailSelect }>;
type OrderEmailContext = ReturnType<typeof buildOrderEmailContext>;

function buildOrderEmailContext(order: OrderEmailRecord, currency: string) {
  const sellers = new Map<string, {
    storeId: string;
    storeName: string;
    fullName: string;
    email: string;
    itemCount: number;
    totalCents: number;
  }>();

  for (const item of order.items) {
    const store = item.store;
    const existing = sellers.get(store.id);

    if (existing) {
      existing.itemCount += item.quantity;
      existing.totalCents += item.totalCents;
      continue;
    }

    sellers.set(store.id, {
      storeId: store.id,
      storeName: store.name,
      fullName: store.sellerProfile.user.fullName,
      email: store.sellerProfile.user.email,
      itemCount: item.quantity,
      totalCents: item.totalCents
    });
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalCents: order.totalCents,
    currency,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    buyer: order.buyer,
    sellers: [...sellers.values()]
  };
}

function isPurchasableCartItem(item: CheckoutCartItem) {
  return (
    item.quantity > 0 &&
    item.quantity <= item.product.stockQuantity &&
    item.product.status === ProductStatus.APPROVED &&
    item.product.category.isActive &&
    item.product.store.status === SellerStatus.APPROVED &&
    item.product.store.sellerProfile.status === SellerStatus.APPROVED
  );
}

function assertOrderItemPurchasable(item: CheckoutCartItem) {
  if (!isPurchasableCartItem(item)) {
    throw new ConflictException(`${item.product.title} is no longer available for purchase.`);
  }
}

function snapshotAddress(address: AddressSnapshot) {
  return {
    id: address.id,
    label: address.label,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode
  };
}

function getStripeImages(images: Array<{ url: string }>) {
  const imageUrl = images[0]?.url;

  return imageUrl && /^https?:\/\//i.test(imageUrl) ? [imageUrl] : undefined;
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `ORD-${timestamp}-${random}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown webhook processing error.";
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}
