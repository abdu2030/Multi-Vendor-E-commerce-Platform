"use client";

import Link from "next/link";
import type React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ArrowRight,
  Shield,
  ShoppingBag,
  Truck,
  Users,
} from "@/components/imported/design-icons";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              Marketplace workspace
            </p>
            <h2 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-stone-900">
              Welcome back, {user?.fullName}.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
              Browse approved products, manage your cart, check out securely, and open seller tools from one Marketo workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
                href="/products"
              >
                Browse products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-sm font-extrabold text-stone-700 transition-colors hover:border-stone-300"
                href="/cart"
              >
                View cart
              </Link>
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 text-sm font-extrabold text-stone-700 transition-colors hover:border-stone-300"
                href="/dashboard/orders"
              >
                Orders
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-stone-900 p-5 text-white">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600">
              <Shield className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-emerald-300">
              Secure session
            </p>
            <h3 className="mt-2 text-xl font-extrabold">API protected</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Dashboard data is loaded through the authenticated backend routes
              built in week one.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          Icon={Users}
          label="Role"
          value={user?.role.replace("_", " ") ?? "Buyer"}
        />
        <MetricCard Icon={ShoppingBag} label="Marketplace" value="Products" />
        <MetricCard Icon={Truck} label="Orders" value="Tracked" />
      </div>
    </div>
  );
}

function MetricCard({
  Icon,
  label,
  value,
}: {
  Icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">
            {label}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold capitalize text-stone-900">
            {value.toLowerCase()}
          </h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}
