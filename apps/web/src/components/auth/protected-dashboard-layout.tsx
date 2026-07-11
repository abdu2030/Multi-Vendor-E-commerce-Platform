"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  CreditCard,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  X,
} from "@/components/imported/design-icons";
import { AuthUser } from "@/lib/auth";
import { getUnreadNotificationCount, NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications";
import { useAuth } from "./auth-provider";

type NavigationItem = {
  href: string;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
  roles?: AuthUser["role"][];
};

const navigation: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Workspace",
    description: "Account overview",
    Icon: LayoutDashboard,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    description: "Protected account",
    Icon: Users,
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    description: "Updates and alerts",
    Icon: Bell,
    roles: ["BUYER", "PENDING_SELLER", "SELLER"],
  },
  {
    href: "/products",
    label: "Products",
    description: "Browse marketplace",
    Icon: ShoppingBag,
  },
  {
    href: "/cart",
    label: "Cart",
    description: "Buyer basket",
    Icon: ShoppingCart,
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    description: "Purchase history",
    Icon: Truck,
  },
  {
    href: "/checkout",
    label: "Checkout",
    description: "Address and payment",
    Icon: CreditCard,
  },
  {
    href: "/dashboard/seller/apply",
    label: "Seller application",
    description: "Store onboarding",
    Icon: FileText,
  },
  {
    href: "/dashboard/seller/status",
    label: "Application status",
    description: "Review progress",
    Icon: Shield,
  },
  {
    href: "/dashboard/seller",
    label: "Seller dashboard",
    description: "Store tools",
    Icon: Package,
    roles: ["SELLER"],
  },
  {
    href: "/dashboard/admin/seller-applications",
    label: "Seller approvals",
    description: "Admin queue",
    Icon: BadgeCheck,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/admin/products",
    label: "Product approvals",
    description: "Listing review",
    Icon: ShoppingBag,
    roles: ["ADMIN"],
  },
];

export function ProtectedDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, accessToken, isLoading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const canSeeNotifications = Boolean(
    user && ["BUYER", "PENDING_SELLER", "SELLER"].includes(user.role),
  );

  const loadUnreadNotifications = useCallback(async () => {
    if (!accessToken || !canSeeNotifications) {
      setUnreadNotifications(0);
      return;
    }

    try {
      const result = await getUnreadNotificationCount(accessToken);
      setUnreadNotifications(result.unreadCount);
    } catch {
      setUnreadNotifications(0);
    }
  }, [accessToken, canSeeNotifications]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  useEffect(() => {
    void loadUnreadNotifications();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadUnreadNotifications);
    window.addEventListener("focus", loadUnreadNotifications);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadUnreadNotifications);
      window.removeEventListener("focus", loadUnreadNotifications);
    };
  }, [loadUnreadNotifications]);

  const visibleNavigation = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigation.filter(
      (item) => !item.roles || item.roles.includes(user.role),
    );
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
        <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm font-bold text-stone-600 shadow-sm">
          Loading your workspace...
        </div>
      </main>
    );
  }

  const isAdminRoute = pathname.startsWith("/dashboard/admin");
  const canSeeAdminRoute = !isAdminRoute || user.role === "ADMIN";

  return (
    <div
      className="flex min-h-screen bg-stone-100 text-stone-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {sidebarOpen ? (
        <button
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-stone-900 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <Link className="flex items-center gap-2.5" href="/dashboard">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600">
              <Package className="h-4 w-4 text-white" />
            </span>
            <span>
              <span className="block text-base font-extrabold leading-none text-white">
                Marketo
              </span>
              <span className="mt-0.5 block text-[10px] font-semibold text-stone-400">
                Marketplace workspace
              </span>
            </span>
          </Link>
        </div>

        <nav
          aria-label="Dashboard navigation"
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
        >
          {visibleNavigation.map(({ href, label, description, Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-stone-400 hover:bg-white/5 hover:text-white"
                }`}
                href={href}
                key={href}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold leading-tight">
                    {label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-semibold text-stone-500 group-hover:text-stone-400">
                    {description}
                  </span>
                </span>
                {href === "/dashboard/notifications" && unreadNotifications > 0 ? (
                  <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-extrabold text-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-extrabold text-white">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {user.fullName}
              </p>
              <p className="truncate text-[10px] font-semibold text-stone-500">
                {user.email}
              </p>
            </div>
            <button
              aria-label="Sign out"
              className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-white/5 hover:text-white"
              onClick={() => {
                void signOut().finally(() => router.replace("/login"));
              }}
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open sidebar"
              className="rounded-xl p-2 transition-colors hover:bg-stone-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              type="button"
            >
              <Menu className="h-5 w-5 text-stone-600" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-stone-900">
                {pageTitle(pathname)}
              </h1>
              <p className="text-xs font-semibold text-stone-400">
                {user.role.replace("_", " ").toLowerCase()} account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-500 sm:inline-flex">
              {user.email}
            </span>
            {canSeeNotifications ? (
              <Link
                aria-label={`${unreadNotifications} unread notifications`}
                className="relative rounded-xl p-2 transition-colors hover:bg-stone-100"
                href="/dashboard/notifications"
              >
                <Bell className="h-5 w-5 text-stone-600" />
                {unreadNotifications > 0 ? (
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                ) : null}
              </Link>
            ) : null}
            <Link
              aria-label="Store settings"
              className="rounded-xl p-2 transition-colors hover:bg-stone-100"
              href="/dashboard/profile"
            >
              <Settings className="h-5 w-5 text-stone-600" />
            </Link>
            <button
              aria-label="Close menu"
              className="hidden rounded-xl p-2 text-stone-400"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {canSeeAdminRoute ? (
            children
          ) : (
            <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                Admin only
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
                This workspace is restricted
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">
                Use an admin account to access marketplace administration.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function pageTitle(pathname: string) {
  if (pathname.includes("/notifications")) {
    return "Notifications";
  }

  if (pathname.includes("/admin/products")) {
    return "Product approvals";
  }

  if (pathname.includes("/admin")) {
    return "Seller approvals";
  }

  if (pathname.includes("/seller/orders")) {
    return "Seller orders";
  }

  if (pathname.includes("/seller/settings")) {
    return "Store settings";
  }

  if (pathname.includes("/seller/status")) {
    return "Application status";
  }

  if (pathname.includes("/seller/apply")) {
    return "Seller application";
  }

  if (pathname.includes("/seller")) {
    return "Seller dashboard";
  }

  if (pathname.includes("/orders")) {
    return "Orders";
  }

  if (pathname.includes("/profile")) {
    return "Profile";
  }

  return "Workspace";
}
