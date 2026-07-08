"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ArrowRight,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Truck,
} from "@/components/imported/design-icons";

const sellerNavigation = [
  { href: "/dashboard/seller", label: "Overview", Icon: LayoutDashboard },
  { href: "/dashboard/seller/products", label: "Products", Icon: ShoppingBag },
  { href: "/dashboard/seller/orders", label: "Orders", Icon: Truck },
  { href: "/dashboard/seller/settings", label: "Store settings", Icon: Settings },
  { href: "/dashboard/seller/status", label: "Application status", Icon: Package },
];

export function SellerDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.role !== "SELLER") {
    return (
      <section className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <Package className="h-7 w-7 text-amber-600" />
        </div>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Seller access
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
          Seller dashboard is available after approval
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-500">
          Submit a seller application or wait for admin approval to access
          store tools.
        </p>
        <Link
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
          href="/dashboard/seller/status"
        >
          View application status
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="px-2 text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Seller tools
        </p>
        <nav aria-label="Seller dashboard" className="mt-4 grid gap-1">
          {sellerNavigation.map(({ href, label, Icon }) => {
            const active = href === "/dashboard/seller"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                }`}
                href={href}
                key={href}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
