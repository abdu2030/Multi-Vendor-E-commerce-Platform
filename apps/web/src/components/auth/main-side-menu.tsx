"use client";

import Link from "next/link";
import type { FC } from "react";
import { LogOut, Package } from "@/components/imported/design-icons";
import type { AuthUser } from "@/lib/auth";

export type MainSideMenuNavigationItem = {
  href: string;
  label: string;
  description: string;
  Icon: FC<{ className?: string }>;
  roles?: AuthUser["role"][];
};

type MainSideMenuProps = {
  id: string;
  isOpen: boolean;
  navigation: MainSideMenuNavigationItem[];
  pathname: string;
  unreadNotifications: number;
  user: AuthUser;
  onSignOut: () => void;
};

export function MainSideMenu({
  id,
  isOpen,
  navigation,
  pathname,
  unreadNotifications,
  user,
  onSignOut,
}: MainSideMenuProps) {
  const hiddenTabIndex = isOpen ? undefined : -1;

  return (
    <aside
      aria-hidden={!isOpen}
      aria-label="Main side menu"
      className={`dashboard-sidebar-shell fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-shrink-0 overflow-hidden bg-stone-900 shadow-2xl transition-[transform,width] duration-300 ease-out will-change-transform lg:static lg:z-auto lg:shadow-none ${
        isOpen
          ? "translate-x-0 lg:w-64"
          : "-translate-x-full lg:w-0 lg:translate-x-0"
      }`}
      id={id}
    >
      <div className="flex h-full w-64 min-w-64 flex-col">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <Link className="flex items-center gap-2.5" href="/dashboard" tabIndex={hiddenTabIndex}>
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
          className="dashboard-sidebar-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
        >
          {navigation.map(({ href, label, description, Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-stone-400 hover:bg-white/5 hover:text-white"
                }`}
                href={href}
                key={href}
                tabIndex={hiddenTabIndex}
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
              onClick={onSignOut}
              tabIndex={hiddenTabIndex}
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
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
