"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Shield,
  ShoppingBag,
  Truck
} from "@/components/imported/design-icons";
import { Address, createAddress, getAddresses, setDefaultAddress } from "@/lib/addresses";
import { CartSummary, getCartSummary } from "@/lib/cart";
import { createCheckoutSession } from "@/lib/checkout";

type AddressFormState = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

const emptyAddressForm: AddressFormState = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "United States",
  postalCode: "",
  isDefault: true
};

export function CheckoutPageClient() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [form, setForm] = useState<AddressFormState>(emptyAddressForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCheckout = useCallback(async () => {
    if (!accessToken) {
      setCart(null);
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [nextCart, nextAddresses] = await Promise.all([
        getCartSummary(accessToken),
        getAddresses(accessToken)
      ]);
      setCart(nextCart);
      setAddresses(nextAddresses);
      setSelectedAddressId((current) => {
        if (current && nextAddresses.some((address) => address.id === current)) {
          return current;
        }

        return nextAddresses.find((address) => address.isDefault)?.id ?? nextAddresses[0]?.id ?? "";
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!authLoading) {
      void loadCheckout();
    }
  }, [authLoading, loadCheckout]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.get("checkout") === "cancelled") {
      setNotice("Checkout was cancelled. Your cart is still saved.");
    }
  }, []);

  const canCheckout = useMemo(() => {
    return Boolean(
      accessToken &&
        selectedAddressId &&
        cart &&
        cart.items.length > 0 &&
        cart.totals.invalidItemCount === 0 &&
        !cart.totals.hasStockIssues
    );
  }, [accessToken, cart, selectedAddressId]);

  const handleCreateAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken || isSavingAddress) {
      return;
    }

    setIsSavingAddress(true);
    setError(null);

    try {
      const address = await createAddress(accessToken, {
        label: form.label,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state || undefined,
        country: form.country,
        postalCode: form.postalCode || undefined,
        isDefault: form.isDefault
      });
      const nextAddresses = await getAddresses(accessToken);

      setAddresses(nextAddresses);
      setSelectedAddressId(address.id);
      setForm({ ...emptyAddressForm, isDefault: false });
      setNotice("Shipping address saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Address could not be saved.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSelectAddress = async (addressId: string) => {
    if (!accessToken) {
      return;
    }

    setSelectedAddressId(addressId);

    try {
      const selected = addresses.find((address) => address.id === addressId);

      if (selected && !selected.isDefault) {
        await setDefaultAddress(accessToken, addressId);
        setAddresses(await getAddresses(accessToken));
      }
    } catch {
      setAddresses((current) => current.map((address) => ({ ...address, isDefault: address.id === addressId })));
    }
  };

  const handleCheckout = async () => {
    if (!accessToken || !canCheckout || isRedirecting) {
      return;
    }

    setIsRedirecting(true);
    setError(null);

    try {
      const session = await createCheckoutSession(accessToken, selectedAddressId);

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.assign(session.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not start.");
      setIsRedirecting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <CheckoutShell>
        <div className="rounded-3xl border border-stone-200 bg-white p-10 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-extrabold text-stone-600">
            <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
            Loading checkout
          </div>
        </div>
      </CheckoutShell>
    );
  }

  if (!accessToken) {
    return (
      <CheckoutShell>
        <div className="grid gap-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:grid-cols-[1fr_320px] md:items-center">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <CreditCard className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-stone-950">Sign in to checkout</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-stone-500">
              Checkout uses your saved cart and shipping address, so you need an active buyer session first.
            </p>
          </div>
          <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-extrabold text-white transition hover:bg-stone-700" href="/login">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Checkout</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Shipping and payment</h1>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 text-sm font-extrabold text-stone-700 transition hover:border-stone-300" href="/cart">
          Back to cart
        </Link>
      </div>

      {error ? <Alert tone="red" message={error} /> : null}
      {notice ? <Alert tone="emerald" message={notice} /> : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">Shipping address</h2>
                <p className="mt-1 text-sm leading-6 text-stone-500">
                  Choose where this order should ship. This address is attached to the Stripe session metadata for fulfillment.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm font-bold text-stone-500">
                  Add a shipping address to continue.
                </div>
              ) : (
                addresses.map((address) => (
                  <AddressOption
                    address={address}
                    isSelected={selectedAddressId === address.id}
                    key={address.id}
                    onSelect={() => void handleSelectAddress(address.id)}
                  />
                ))
              )}
            </div>
          </div>

          <form className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={handleCreateAddress}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">Add address</h2>
                <p className="mt-1 text-sm leading-6 text-stone-500">Save a delivery address without leaving checkout.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <TextInput label="Label" value={form.label} onChange={(value) => setForm((current) => ({ ...current, label: value }))} required />
              <TextInput label="Country" value={form.country} onChange={(value) => setForm((current) => ({ ...current, country: value }))} required />
              <div className="sm:col-span-2">
                <TextInput label="Address line 1" value={form.line1} onChange={(value) => setForm((current) => ({ ...current, line1: value }))} required />
              </div>
              <div className="sm:col-span-2">
                <TextInput label="Address line 2" value={form.line2} onChange={(value) => setForm((current) => ({ ...current, line2: value }))} />
              </div>
              <TextInput label="City" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} required />
              <TextInput label="State" value={form.state} onChange={(value) => setForm((current) => ({ ...current, state: value }))} />
              <TextInput label="Postal code" value={form.postalCode} onChange={(value) => setForm((current) => ({ ...current, postalCode: value }))} />
              <label className="flex h-12 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-extrabold text-stone-700">
                <input
                  checked={form.isDefault}
                  className="h-4 w-4 accent-emerald-600"
                  onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                  type="checkbox"
                />
                Use as default
              </label>
            </div>

            <button
              className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-5 text-sm font-extrabold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
              disabled={isSavingAddress}
              type="submit"
            >
              {isSavingAddress ? "Saving..." : "Save address"}
            </button>
          </form>
        </div>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Total due</p>
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
            <SummaryRow label="Shipping" value="Calculated later" />
          </div>

          {cart && cart.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              Your cart is empty. Add products before checkout.
            </div>
          ) : null}

          {cart?.totals.invalidItemCount || cart?.totals.hasStockIssues ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              Resolve unavailable or overstocked items in your cart before payment.
            </div>
          ) : null}

          <button
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
            disabled={!canCheckout || isRedirecting}
            onClick={() => void handleCheckout()}
            type="button"
          >
            {isRedirecting ? "Redirecting..." : "Continue to Stripe"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-5 grid gap-3 border-t border-stone-100 pt-5">
            {[
              { Icon: Shield, text: "Server-side cart validation" },
              { Icon: Truck, text: "Selected address saved" },
              { Icon: CreditCard, text: "Stripe test checkout" }
            ].map(({ Icon, text }) => (
              <div className="flex items-center gap-3 text-sm font-bold text-stone-500" key={text}>
                <Icon className="h-4 w-4 text-emerald-600" />
                {text}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </CheckoutShell>
  );
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
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
            <Link className="text-stone-500 transition hover:text-stone-950" href="/cart">Cart</Link>
            <Link className="rounded-xl bg-stone-950 px-4 py-2 text-white transition hover:bg-stone-700" href="/dashboard">Account</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</section>
    </main>
  );
}

function AddressOption({ address, isSelected, onSelect }: { address: Address; isSelected: boolean; onSelect: () => void }) {
  return (
    <button
      className={`grid gap-3 rounded-2xl border p-4 text-left transition ${
        isSelected ? "border-emerald-300 bg-emerald-50" : "border-stone-200 bg-white hover:border-stone-300"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-stone-950">{address.label}</span>
            {address.isDefault ? (
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-emerald-700">Default</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">{formatAddress(address)}</p>
        </div>
        {isSelected ? <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-700" /> : null}
      </div>
    </button>
  );
}

function TextInput({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-stone-700">
      {label}
      <input
        className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-900 outline-none transition placeholder:text-stone-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}

function Alert({ message, tone }: { message: string; tone: "red" | "emerald" }) {
  const className = tone === "red" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-100 bg-emerald-50 text-emerald-800";

  return (
    <div className={`mb-5 flex items-start gap-3 rounded-3xl border p-5 text-sm font-bold ${className}`}>
      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
      {message}
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

function formatAddress(address: Address) {
  return [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}
