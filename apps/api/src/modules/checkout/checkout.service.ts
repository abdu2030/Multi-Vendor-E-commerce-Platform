import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CartStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
  SellerStatus
} from "@prisma/client";
import Stripe from "stripe";
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
        return this.updateCheckoutSessionPayment(
          event.data.object as Stripe.Checkout.Session,
          PaymentStatus.PAID,
          event.id
        );
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

    const cartId = session.client_reference_id ?? session.metadata?.cartId ?? null;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status,
          rawEventId: eventId
        }
      });

      if (status === PaymentStatus.PAID && cartId) {
        await tx.cart.updateMany({
          where: {
            id: cartId,
            status: CartStatus.ACTIVE
          },
          data: { status: CartStatus.CHECKED_OUT }
        });
      }
    });

    return {
      action: "payment_updated",
      sessionId: session.id,
      paymentStatus: status
    };
  }

  private findCheckoutCart(userId: string) {
    return this.prisma.cart.findFirst({
      where: {
        userId,
        status: CartStatus.ACTIVE
      },
      select: {
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
      }
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
}

type CheckoutCart = NonNullable<Awaited<ReturnType<CheckoutService["findCheckoutCart"]>>>;
type CheckoutCartItem = CheckoutCart["items"][number];

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

function getStripeImages(images: Array<{ url: string }>) {
  const imageUrl = images[0]?.url;

  return imageUrl && /^https?:\/\//i.test(imageUrl) ? [imageUrl] : undefined;
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
