"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./auth-provider";

const navigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/seller/apply", label: "Seller application" },
  { href: "/dashboard/seller/status", label: "Application status" },
  { href: "/dashboard/admin/seller-applications", label: "Seller approvals", roles: ["ADMIN"] }
];

export function ProtectedDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <main className="dashboard-loading">
        <p>Loading your workspace...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/dashboard">
          MultiVendor
        </Link>
        <nav aria-label="Dashboard">
          {navigation
            .filter((item) => !item.roles || item.roles.includes(user.role))
            .map((item) => (
              <Link
                className={pathname === item.href ? "nav-item active" : "nav-item"}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
        </nav>
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Signed in as {user.role.toLowerCase()}</p>
            <h1>{user.fullName}</h1>
          </div>
          <button
            className="secondary-button"
            onClick={() => {
              void signOut().finally(() => router.replace("/login"));
            }}
            type="button"
          >
            Sign out
          </button>
        </header>
        {children}
      </section>
    </main>
  );
}
