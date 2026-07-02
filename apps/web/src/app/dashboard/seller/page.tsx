"use client";

import { SellerDashboardShell } from "@/components/sellers/seller-dashboard-shell";
import { SellerOverview } from "@/components/sellers/seller-overview";

export default function SellerDashboardPage() {
  return (
    <SellerDashboardShell>
      <div className="mb-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Seller dashboard
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
          Store overview
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Track your approved store profile, product count, and early order
          metrics from the same workspace.
        </p>
      </div>
      <SellerOverview />
    </SellerDashboardShell>
  );
}
