"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MarketplaceHeader({
  active = "products",
}: {
  active?: "home" | "products" | "cart";
}) {
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/85 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2.5" href="/">
          <BrandLogo />
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
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-400">
              Checking...
            </span>
          ) : user ? (
            <Link
              className="max-w-[220px] truncate rounded-xl bg-slate-950 px-4 py-2 text-white shadow-lg shadow-slate-900/10 transition hover:bg-fuchsia-700"
              href="/dashboard"
            >
              {user.email}
            </Link>
          ) : (
            <Link
              className="rounded-xl bg-slate-950 px-4 py-2 text-white shadow-lg shadow-slate-900/10 transition hover:bg-fuchsia-700"
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
    ? "text-fuchsia-700"
    : "text-slate-500 transition hover:text-slate-950";
}