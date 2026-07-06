"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "@/components/imported/design-icons";
import { BuyerOrderSummary, getBuyerOrders, OrderStatus } from "@/lib/orders";

export function OrderHistoryClient() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<BuyerOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBuyerOrders(accessToken);
      setOrders(result.orders);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Orders could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading) {
      void loadOrders();
    }
  }, [authLoading, loadOrders]);

  const paidOrders = useMemo(() => orders.filter((order) => order.status !== "CANCELLED" && order.status !== "REFUNDED").length, [orders]);

  if (authLoading || isLoading) {
    return <OrderLoading />;
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Buyer orders</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Order history</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
              Review purchases created from paid Stripe checkout sessions, with fulfillment status and payment details in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-extrabold text-stone-700 transition hover:border-stone-300 hover:bg-white"
              onClick={loadOrders}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-700" href="/products">
              Browse products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard Icon={ShoppingBag} label="Orders" value={String(orders.length)} />
        <MetricCard Icon={CheckCircle} label="Active" value={String(paidOrders)} />
        <MetricCard Icon={Truck} label="Fulfillment" value={orders.some((order) => order.status === "SHIPPED") ? "Shipping" : "Tracked"} />
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      {orders.length === 0 && !error ? <EmptyOrders /> : null}

      {orders.length > 0 ? (
        <section className="grid gap-4">
          {orders.map((order) => (
            <OrderCard order={order} key={order.id} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function OrderCard({ order }: { order: BuyerOrderSummary }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start lg:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-extrabold text-stone-500">
              {formatDate(order.placedAt)}
            </span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-extrabold text-stone-500">
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold text-stone-950">{order.orderNumber}</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {order.previewItems.map((item) => (
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2" key={item.id}>
                <ProductThumb image={item.productImage} title={item.productTitle} />
                <div className="min-w-0">
                  <p className="max-w-[220px] truncate text-sm font-extrabold text-stone-900">{item.productTitle}</p>
                  <p className="text-xs font-bold text-stone-500">Qty {item.quantity} - {item.store.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="text-left lg:text-right">
            <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Total</p>
            <p className="mt-1 text-2xl font-extrabold text-stone-950">{formatMoney(order.totals.totalCents, order.totals.currency)}</p>
            <p className="mt-1 text-xs font-bold capitalize text-stone-500">{order.payment?.provider ?? "payment"} {order.payment?.status?.toLowerCase() ?? "pending"}</p>
          </div>
          <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-extrabold text-white transition hover:bg-stone-700" href={`/dashboard/orders/${order.id}`}>
            View details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyOrders() {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Package className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-2xl font-extrabold text-stone-950">No orders yet</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
        Completed Stripe checkout sessions will appear here after the webhook creates the order.
      </p>
      <Link className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700" href="/products">
        Browse products
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function OrderLoading() {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-extrabold text-stone-600">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
        Loading orders
      </div>
    </section>
  );
}

function MetricCard({ Icon, label, value }: { Icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
          <h3 className="mt-2 text-2xl font-extrabold capitalize text-stone-900">{value.toLowerCase()}</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const classes = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PROCESSING: "bg-sky-50 text-sky-700 ring-sky-200",
    SHIPPED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    DELIVERED: "bg-stone-950 text-white ring-stone-950",
    CANCELLED: "bg-red-50 text-red-700 ring-red-200",
    REFUNDED: "bg-purple-50 text-purple-700 ring-purple-200",
  } satisfies Record<OrderStatus, string>;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ring-1 ${classes[status]}`}>
      <Clock className="h-3.5 w-3.5" />
      {status.replace("_", " ")}
    </span>
  );
}

export function ProductThumb({ image, title }: { image: string | null; title: string }) {
  if (image) {
    return <img alt={title} className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" src={image} />;
  }

  return (
    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-stone-300 ring-1 ring-stone-200">
      <Package className="h-5 w-5" />
    </span>
  );
}

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
