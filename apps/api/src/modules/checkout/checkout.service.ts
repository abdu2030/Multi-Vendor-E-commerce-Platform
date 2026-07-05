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
  ProductStatus,
  SellerStatus
} from "@prisma/client";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CheckoutService {
  private readonly stripe: Stripe | null;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService
  ) {
    const secretKey = config.get<string>("STRIPE_SECRET_KEY")?.trim();

    this.stripe = secretKey ? new Stripe(secretKey) : null;
    this.frontendUrl = normalizeUrl(config.get<string>("FRONTEND_URL") ?? "http://localhost:3000");
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

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}
