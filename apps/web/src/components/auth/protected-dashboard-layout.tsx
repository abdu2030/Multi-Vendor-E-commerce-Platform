"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BarChart2,
  Bell,
  FileText,
  LayoutDashboard,
  Menu,
  CreditCard,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  X,
} from "@/components/imported/design-icons";
import { getUnreadNotificationCount, NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MainSideMenu } from "./main-side-menu";
import type { MainSideMenuNavigationItem } from "./main-side-menu";
import { useAuth } from "./auth-provider";

const MAIN_SIDE_MENU_ID = "main-dashboard-side-menu";

const navigation: MainSideMenuNavigationItem[] = [
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
    href: "/dashboard/seller",
    label: "Seller dashboard",
    description: "Store tools",
    Icon: Package,
    roles: ["SELLER"],
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
    href: "/dashboard/admin",
    label: "Admin overview",
    description: "Stats and revenue",
    Icon: BarChart2,
    roles: ["ADMIN"],
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
    label: "Product moderation",
    description: "Listing review",
    Icon: ShoppingBag,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/admin/categories",
    label: "Categories",
    description: "Catalog taxonomy",
    Icon: Tag,
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
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
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
    setSideMenuOpen(window.matchMedia("(min-width: 1024px)").matches);
  }, []);

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
      className="flex h-screen overflow-hidden bg-stone-100 text-stone-900"
      style={{
        fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <MainSideMenu
        id={MAIN_SIDE_MENU_ID}
        isOpen={sideMenuOpen}
        navigation={visibleNavigation}
        onSignOut={() => {
          void signOut().finally(() => router.replace("/login"));
        }}
        pathname={pathname}
        unreadNotifications={unreadNotifications}
        user={user}
      />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin,width] duration-300 ease-out">
        <header className="flex flex-shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-controls={MAIN_SIDE_MENU_ID}
              aria-expanded={sideMenuOpen}
              aria-label={sideMenuOpen ? "Close main side menu" : "Open main side menu"}
              className="relative z-50 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2"
              onClick={() => setSideMenuOpen((open) => !open)}
              type="button"
            >
              <span className="relative block h-5 w-5" aria-hidden="true">
                <Menu
                  className={`absolute inset-0 h-5 w-5 transition-all duration-200 ease-out ${
                    sideMenuOpen
                      ? "rotate-90 scale-75 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  }`}
                />
                <X
                  className={`absolute inset-0 h-5 w-5 transition-all duration-200 ease-out ${
                    sideMenuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-75 opacity-0"
                  }`}
                />
              </span>
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-stone-900">
                {pageTitle(pathname)}
              </h1>
              <p className="truncate text-xs font-semibold text-stone-400">
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
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-white" />
                ) : null}
              </Link>
            ) : null}
            <ThemeToggle compact />
            <Link
              aria-label="Store settings"
              className="rounded-xl p-2 transition-colors hover:bg-stone-100"
              href="/dashboard/profile"
            >
              <Settings className="h-5 w-5 text-stone-600" />
            </Link>
          </div>
        </header>

        <main className="dashboard-main-scrollbar min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {canSeeAdminRoute ? (
            children
          ) : (
            <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-widest text-fuchsia-600">
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

function pageTitle(pathname: string) {
  if (pathname.includes("/notifications")) {
    return "Notifications";
  }

  if (pathname === "/dashboard/admin") {
    return "Admin overview";
  }

  if (pathname.includes("/admin/products")) {
    return "Product moderation";
  }

  if (pathname.includes("/admin/categories")) {
    return "Category management";
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
