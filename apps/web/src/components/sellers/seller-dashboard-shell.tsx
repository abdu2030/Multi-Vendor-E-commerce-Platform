"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const sellerNavigation = [
  { href: "/dashboard/seller", label: "Overview" },
  { href: "/dashboard/seller/settings", label: "Store settings" },
  { href: "/dashboard/seller/status", label: "Application status" }
];

export function SellerDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user?.role !== "SELLER") {
    return (
      <section className="empty-state">
        <p className="eyebrow">Seller access</p>
        <h2>Seller dashboard is available after approval</h2>
        <p>Submit a seller application or wait for admin approval to access store tools.</p>
        <Link className="primary-button" href="/dashboard/seller/status">
          View application status
        </Link>
      </section>
    );
  }

  return (
    <section className="seller-workspace">
      <aside className="seller-sidebar">
        <p className="eyebrow">Seller tools</p>
        <nav aria-label="Seller dashboard">
          {sellerNavigation.map((item) => (
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
      <div className="seller-content">{children}</div>
    </section>
  );
}
