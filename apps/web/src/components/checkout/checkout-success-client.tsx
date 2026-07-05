"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle, Package, ShoppingBag } from "@/components/imported/design-icons";

export function CheckoutSuccessClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setSessionId(query.get("session_id"));
  }, []);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-2.5" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Package className="h-4 w-4" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-stone-950">Marketo</span>
          </Link>
          <Link className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-stone-700" href="/products">
            Products
          </Link>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-stone-950">Payment session completed</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-500">
            Stripe returned you to the marketplace. Order creation and webhook confirmation are the next checkout milestone.
          </p>
          {sessionId ? (
            <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left text-xs font-bold text-stone-500">
              <span className="block text-stone-950">Stripe session</span>
              <span className="mt-1 block break-all">{sessionId}</span>
            </div>
          ) : null}
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700" href="/products">
              Keep shopping
              <ShoppingBag className="h-4 w-4" />
            </Link>
            <Link className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-sm font-extrabold text-stone-800 transition hover:border-stone-300" href="/dashboard">
              Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
