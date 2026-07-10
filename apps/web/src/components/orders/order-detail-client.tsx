"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "@/components/imported/design-icons";
import { ProductReviewsPanel } from "@/components/reviews/product-reviews-panel";
import { BuyerOrderDetail, getBuyerOrder } from "@/lib/orders";
import { formatDate, formatMoney, ProductThumb, StatusBadge } from "./order-history-client";

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<BuyerOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!accessToken) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setOrder(await getBuyerOrder(accessToken, orderId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Order could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, orderId]);

  useEffect(() => {
    if (!authLoading) {
      void loadOrder();
    }
  }, [authLoading, loadOrder]);

  const addressLines = useMemo(() => formatAddress(order?.shippingAddress), [order]);

  if (authLoading || isLoading) {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-extrabold text-stone-600">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
          Loading order
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <div className="flex items-start gap-3 text-sm font-bold text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-extrabold">Order unavailable</p>
            <p className="mt-1">{error ?? "Order was not found."}</p>
            <Link className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 text-sm font-extrabold text-white transition hover:bg-red-800" href="/dashboard/orders">
              Back to orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const canReviewOrder = isReviewableOrderStatus(order.status);

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="text-sm font-extrabold text-emerald-700 transition hover:text-emerald-800" href="/dashboard/orders">
              Back to order history
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-extrabold text-stone-500">
                Placed {formatDate(order.placedAt)}
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-stone-950">{order.orderNumber}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
              Buyer-facing receipt, payment reference, shipping address, and seller fulfillment status for every item in this order.
            </p>
          </div>
          <div className="rounded-3xl bg-stone-950 p-5 text-white lg:min-w-[260px]">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">Order total</p>
            <p className="mt-2 text-3xl font-extrabold">{formatMoney(order.totals.totalCents, order.totals.currency)}</p>
            <p className="mt-2 text-sm font-bold text-stone-400">{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Items</p>
                <h3 className="text-xl font-extrabold text-stone-950">Purchased products</h3>
              </div>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {order.items.map((item) => (
              <article className="grid gap-4 p-5 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-start sm:p-6" key={item.id}>
                <Link href={`/products/${item.product.slug}`}>
                  <ProductThumb image={item.productImage} title={item.productTitle} />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link className="text-lg font-extrabold text-stone-950 transition hover:text-emerald-700" href={`/products/${item.product.slug}`}>
                      {item.productTitle}
                    </Link>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-extrabold text-stone-500">
                      {item.store.name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-stone-500">
                    {formatMoney(item.unitPriceCents, order.totals.currency)} each - quantity {item.quantity}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                    <Truck className="h-3.5 w-3.5" />
                    {item.sellerFulfillmentStatus.replace("_", " ")}
                  </p>
                  {item.trackingNumber ? (
                    <p className="mt-2 text-xs font-bold text-stone-500">Tracking {item.trackingNumber}</p>
                  ) : null}
                  {canReviewOrder ? (
                    <div className="mt-4">
                      <ProductReviewsPanel
                        compact
                        productId={item.productId}
                        productTitle={item.productTitle}
                        showList={false}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Line total</p>
                  <p className="mt-1 text-lg font-extrabold text-stone-950">{formatMoney(item.totalCents, order.totals.currency)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid h-fit gap-4">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Payment</p>
                <h3 className="text-xl font-extrabold text-stone-950">{order.payment?.status ?? "Pending"}</h3>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm font-bold text-stone-600">
              <SummaryRow label="Provider" value={order.payment?.provider ?? "Stripe"} />
              <SummaryRow label="Reference" value={shortReference(order.payment?.providerRef)} />
              <SummaryRow label="Amount" value={formatMoney(order.payment?.amountCents ?? order.totals.totalCents, order.totals.currency)} />
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Delivery</p>
                <h3 className="text-xl font-extrabold text-stone-950">Shipping address</h3>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm font-bold leading-7 text-stone-600">
              {addressLines.length ? addressLines.map((line) => <p key={line}>{line}</p>) : <p>No shipping address saved.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Summary</p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-stone-600">
              <SummaryRow label="Subtotal" value={formatMoney(order.totals.subtotalCents, order.totals.currency)} />
              <SummaryRow label="Shipping" value={formatMoney(order.totals.shippingCents, order.totals.currency)} />
              <SummaryRow label="Tax" value={formatMoney(order.totals.taxCents, order.totals.currency)} />
              <SummaryRow label="Discount" value={`-${formatMoney(order.totals.discountCents, order.totals.currency)}`} />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-5">
              <span className="text-sm font-extrabold text-stone-950">Total</span>
              <span className="text-xl font-extrabold text-stone-950">{formatMoney(order.totals.totalCents, order.totals.currency)}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function isReviewableOrderStatus(status: string) {
  return ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status);
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="max-w-[180px] truncate text-right font-extrabold capitalize text-stone-950">{value.toLowerCase()}</span>
    </div>
  );
}

function shortReference(value?: string) {
  if (!value) {
    return "Not linked";
  }

  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-6)}` : value;
}

function formatAddress(address: unknown) {
  if (!address || typeof address !== "object") {
    return [];
  }

  const record = address as Record<string, unknown>;
  const lines = [record.label, record.line1, record.line2, [record.city, record.state, record.postalCode].filter(Boolean).join(", "), record.country]
    .filter((line): line is string => typeof line === "string" && line.trim().length > 0)
    .map((line) => line.trim());

  return lines;
}
