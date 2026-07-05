"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Package,
  RefreshCw,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck
} from "@/components/imported/design-icons";
import { CartItem, CartSummary, getCartSummary, removeCartItem, updateCartItem } from "@/lib/cart";

export function CartPageClient() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    if (!accessToken) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setCart(await getCartSummary(accessToken));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cart could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading) {
      void loadCart();
    }
  }, [authLoading, loadCart]);

  const canCheckout = useMemo(() => {
    return Boolean(cart && cart.items.length > 0 && cart.totals.invalidItemCount === 0 && !cart.totals.hasStockIssues);
  }, [cart]);

  const updateQuantity = async (item: CartItem, quantity: number) => {
    if (!accessToken || pendingItemId) {
      return;
    }

    const nextQuantity = Math.max(1, Math.min(quantity, item.stock.availableQuantity || quantity));

    if (nextQuantity === item.quantity) {
      return;
    }

    setPendingItemId(item.id);
    setError(null);

    try {
      setCart(await updateCartItem(accessToken, item.id, nextQuantity));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Quantity could not update.");
    } finally {
      setPendingItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!accessToken || pendingItemId) {
      return;
    }

    setPendingItemId(itemId);
    setError(null);

    try {
      setCart(await removeCartItem(accessToken, itemId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Item could not be removed.");
    } finally {
      setPendingItemId(null);
    }
  };

  const handleCheckout = () => {
    if (!canCheckout) {
      return;
    }

    setCheckoutNotice("Checkout is ready for the next checkout workflow step.");
  };

  if (authLoading || isLoading) {
    return (
      <CartShell>
        <div className="rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-extrabold text-stone-600">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            Loading cart
          </div>
        </div>
      </CartShell>
    );
  }

  if (!accessToken) {
    return (
      <CartShell>
        <div className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:grid-cols-[1fr_320px] md:items-center">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-stone-950">Sign in to view your cart</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
              Cart items are connected to your buyer account so prices, stock, and seller availability stay current.
            </p>
          </div>
          <div className="grid gap-3">
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-extrabold text-white transition hover:bg-stone-700" href="/login">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link className="inline-flex h-12 items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-extrabold text-stone-800 transition hover:border-stone-300" href="/products">
              Browse products
            </Link>
          </div>
        </div>
      </CartShell>
    );
  }

  return (
    <CartShell>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Shopping cart</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Review your items</h1>
              </div>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-extrabold text-stone-700 transition hover:border-stone-300 hover:bg-white"
                onClick={loadCart}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          ) : null}

          {!cart || cart.items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartLineItem
                  item={item}
                  isPending={pendingItemId === item.id}
                  key={item.id}
                  onRemove={() => void removeItem(item.id)}
                  onUpdateQuantity={(quantity) => void updateQuantity(item, quantity)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Subtotal</p>
              <p className="mt-1 text-3xl font-extrabold text-stone-950">
                {formatMoney(cart?.totals.subtotalCents ?? 0, cart?.totals.currency ?? "USD")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 text-sm font-bold text-stone-600">
            <SummaryRow label="Items" value={String(cart?.totals.itemCount ?? 0)} />
            <SummaryRow label="Quantity" value={String(cart?.totals.totalQuantity ?? 0)} />
            <SummaryRow label="Stock issues" value={cart?.totals.hasStockIssues ? "Yes" : "No"} />
          </div>

          {cart?.totals.invalidItemCount ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              Resolve unavailable or overstocked items before checkout.
            </div>
          ) : null}

          {checkoutNotice ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
              {checkoutNotice}
            </div>
          ) : null}

          <button
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
            disabled={!canCheckout}
            onClick={handleCheckout}
            type="button"
          >
            Checkout
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-5 grid gap-3 border-t border-stone-100 pt-5">
            {[
              { Icon: Shield, text: "Approved products only" },
              { Icon: Truck, text: "Seller-managed fulfillment" },
              { Icon: BadgeCheck, text: "Live stock validation" }
            ].map(({ Icon, text }) => (
              <div className="flex items-center gap-3 text-sm font-bold text-stone-500" key={text}>
                <Icon className="h-4 w-4 text-emerald-600" />
                {text}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </CartShell>
  );
}

function CartShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Package className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-stone-950">Marketo</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold">
            <Link className="text-stone-500 transition hover:text-stone-950" href="/products">Products</Link>
            <Link className="text-emerald-700" href="/cart">Cart</Link>
            <Link className="rounded-xl bg-stone-950 px-4 py-2 text-white transition hover:bg-stone-700" href="/dashboard">Account</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</section>
    </main>
  );
}

function CartLineItem({
  item,
  isPending,
  onRemove,
  onUpdateQuantity
}: {
  item: CartItem;
  isPending: boolean;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}) {
  const quantityLimit = Math.max(1, item.stock.availableQuantity);

  return (
    <article className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:p-5">
      <Link className="aspect-square overflow-hidden rounded-2xl bg-stone-100" href={`/products/${item.product.slug}`}>
        {item.product.image ? (
          <img alt={item.product.image.altText ?? item.product.title} className="h-full w-full object-cover" src={item.product.image.url} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-stone-300" />
          </div>
        )}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                {item.product.category.name}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-extrabold text-stone-500">
                {item.product.store.name}
              </span>
            </div>
            <Link className="mt-3 block text-lg font-extrabold leading-snug text-stone-950 transition hover:text-emerald-700" href={`/products/${item.product.slug}`}>
              {item.product.title}
            </Link>
            <p className="mt-1 text-sm font-bold text-stone-500">
              {formatMoney(item.pricing.unitPriceCents, item.pricing.currency)} each · {item.stock.availableQuantity} available
            </p>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Line total</p>
            <p className="mt-1 text-xl font-extrabold text-stone-950">
              {formatMoney(item.pricing.lineTotalCents, item.pricing.currency)}
            </p>
          </div>
        </div>

        {item.validation.issues.length ? (
          <div className="mt-4 grid gap-2">
            {item.validation.issues.map((issue) => (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800" key={issue.code}>
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {issue.message}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-grid h-11 grid-cols-[44px_56px_44px] overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            <button
              aria-label={`Decrease quantity for ${item.product.title}`}
              className="flex items-center justify-center text-lg font-extrabold text-stone-700 transition hover:bg-white disabled:text-stone-300"
              disabled={isPending || item.quantity <= 1}
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              type="button"
            >
              -
            </button>
            <div className="flex items-center justify-center border-x border-stone-200 text-sm font-extrabold text-stone-950">
              {isPending ? "..." : item.quantity}
            </div>
            <button
              aria-label={`Increase quantity for ${item.product.title}`}
              className="flex items-center justify-center text-lg font-extrabold text-stone-700 transition hover:bg-white disabled:text-stone-300"
              disabled={isPending || item.quantity >= quantityLimit}
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              type="button"
            >
              +
            </button>
          </div>

          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-extrabold text-red-700 transition hover:border-red-200 hover:bg-red-100 disabled:opacity-60"
            disabled={isPending}
            onClick={onRemove}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyCart() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <ShoppingCart className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold text-stone-950">Your cart is empty</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
        Browse approved products from verified sellers and add items when you are ready.
      </p>
      <Link className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700" href="/products">
        Browse products
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="font-extrabold text-stone-950">{value}</span>
    </div>
  );
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}
