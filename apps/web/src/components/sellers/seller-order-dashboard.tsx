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
import { getSellerOrders, SellerFulfillmentStatus, SellerOrderItem, SellerOrdersResponse } from "@/lib/seller-orders";

const statusOptions: Array<{ label: string; value: SellerFulfillmentStatus | "" }> = [
  { label: "All statuses", value: "" },
  { label: "Paid", value: "PAID" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export function SellerOrderDashboard() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<SellerFulfillmentStatus | "">("");
  const [orders, setOrders] = useState<SellerOrdersResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setOrders(await getSellerOrders(accessToken, status || undefined));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Seller orders could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const activeItems = useMemo(
    () => orders?.items.filter((item) => !["CANCELLED", "REFUNDED"].includes(item.sellerFulfillmentStatus)).length ?? 0,
    [orders],
  );

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading seller orders...
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      {error ? (
        <p className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard Icon={ShoppingBag} label="Order items" value={orders?.metrics.orderItems ?? 0} />
        <MetricCard Icon={Truck} label="Active fulfillments" value={activeItems} />
        <MetricCard Icon={CheckCircle} label="Seller revenue" value={formatMoney(orders?.metrics.totalCents ?? 0, orders?.metrics.currency ?? "USD")} />
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              {orders?.store.name ?? "Seller store"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-stone-900">Seller order items</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
              This view only includes products sold by your store. Other seller items from the same buyer order are not returned by the API.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="h-11 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-bold text-stone-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              onChange={(event) => setStatus(event.target.value as SellerFulfillmentStatus | "")}
              value={status}
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-extrabold text-stone-700 transition hover:border-stone-300 hover:bg-white"
              onClick={loadOrders}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {!orders?.items.length && !error ? <EmptySellerOrders /> : null}

        {orders?.items.length ? (
          <div className="divide-y divide-stone-100">
            {orders.items.map((item) => (
              <SellerOrderRow item={item} key={item.id} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SellerOrderRow({ item }: { item: SellerOrderItem }) {
  return (
    <article className="grid gap-4 p-5 transition-colors hover:bg-stone-50/70 lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center">
      <Link className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-stone-100" href={`/products/${item.product.slug}`}>
        {item.productImage ? (
          <img alt={item.productTitle} className="h-full w-full object-cover" src={item.productImage} />
        ) : (
          <Package className="h-6 w-6 text-stone-400" />
        )}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-extrabold text-stone-900">{item.productTitle}</h3>
          <StatusBadge status={item.sellerFulfillmentStatus} />
        </div>
        <p className="mt-1 text-xs font-bold text-stone-400">
          {item.order.orderNumber} / {formatDate(item.order.placedAt)} / {item.buyer.fullName}
        </p>
        <div className="mt-3 grid gap-2 text-sm font-bold text-stone-600 sm:grid-cols-3">
          <InfoPill label="Quantity" value={String(item.quantity)} />
          <InfoPill label="Line total" value={formatMoney(item.totalCents, item.payment?.currency ?? "USD")} />
          <InfoPill label="Payment" value={item.payment?.status ?? "Pending"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-extrabold text-stone-700 transition hover:border-stone-300"
          href={`/products/${item.product.slug}`}
        >
          Product
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function EmptySellerOrders() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
        <Truck className="h-7 w-7 text-emerald-600" />
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-stone-900">No seller order items yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
        Paid checkout orders containing your approved products will appear here.
      </p>
    </div>
  );
}

function MetricCard({ Icon, label, value }: { Icon: React.FC<{ className?: string }>; label: string; value: string | number }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
          <h3 className="mt-2 text-2xl font-extrabold text-stone-900">{value}</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: SellerFulfillmentStatus }) {
  const tone = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PROCESSING: "border-sky-200 bg-sky-50 text-sky-700",
    SHIPPED: "border-indigo-200 bg-indigo-50 text-indigo-700",
    DELIVERED: "border-stone-900 bg-stone-900 text-white",
    CANCELLED: "border-red-200 bg-red-50 text-red-700",
    REFUNDED: "border-purple-200 bg-purple-50 text-purple-700",
  } satisfies Record<SellerFulfillmentStatus, string>;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${tone[status]}`}>
      <Clock className="h-3.5 w-3.5" />
      {status.replace("_", " ")}
    </span>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
      <p className="mt-1 truncate text-stone-800">{value}</p>
    </div>
  );
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
