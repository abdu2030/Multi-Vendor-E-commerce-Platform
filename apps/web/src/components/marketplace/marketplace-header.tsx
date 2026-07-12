"use client";

import Link from "next/link";
import { Package } from "@/components/imported/design-icons";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MarketplaceHeader({
  active = "products",
}: {
  active?: "home" | "products" | "cart";
}) {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Package className="h-4 w-4" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-stone-950">
            Marketo
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-bold sm:gap-4">
          <Link className={navClass(active === "home")} href="/">
            Home
          </Link>
          <Link className={navClass(active === "products")} href="/products">
            Products
          </Link>
          <Link className={navClass(active === "cart")} href="/cart">
            Cart
          </Link>
          {isLoading ? (
            <span className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-stone-400">
              Checking...
            </span>
          ) : user ? (
            <Link
              className="max-w-[220px] truncate rounded-xl bg-stone-950 px-4 py-2 text-white transition hover:bg-stone-700"
              href="/dashboard"
            >
              {user.email}
            </Link>
          ) : (
            <Link
              className="rounded-xl bg-stone-950 px-4 py-2 text-white transition hover:bg-stone-700"
              href="/login"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle compact />
        </nav>
      </div>
    </header>
  );
}

function navClass(isActive: boolean) {
  return isActive
    ? "text-emerald-700"
    : "text-stone-500 transition hover:text-stone-950";
}
