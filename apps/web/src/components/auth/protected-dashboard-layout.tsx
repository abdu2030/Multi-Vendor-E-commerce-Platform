"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "./auth-provider";

const navigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/seller", label: "Seller dashboard", roles: ["SELLER"] },
  { href: "/dashboard/seller/apply", label: "Seller application" },
  { href: "/dashboard/seller/status", label: "Application status" },
  {
    href: "/dashboard/admin/seller-applications",
    label: "Seller approvals",
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

  if (pathname.startsWith("/dashboard/admin")) {
    if (user.role !== "ADMIN") {
      return (
        <main className="dashboard-main">
          <section className="empty-state">
            <p className="eyebrow">Admin only</p>
            <h2>This workspace is restricted</h2>
            <p>Use an admin account to access marketplace administration.</p>
          </section>
        </main>
      );
    }

    return <>{children}</>;
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="dashboard-brand" href="/dashboard">
          <span>MV</span>
          MultiVendor
        </Link>
        <nav aria-label="Dashboard">
          {navigation
            .filter((item) => !item.roles || item.roles.includes(user.role))
            .map((item) => (
              <Link
                className={
                  pathname === item.href ? "nav-item active" : "nav-item"
                }
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
          <div className="dashboard-actions">
            <span className="user-chip">{user.email}</span>
            <button
              className="secondary-button"
              onClick={() => {
                void signOut().finally(() => router.replace("/login"));
              }}
              type="button"
            >
              Sign out
            </button>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
