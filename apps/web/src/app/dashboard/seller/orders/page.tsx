"use client";

import { SellerDashboardShell } from "@/components/sellers/seller-dashboard-shell";
import { SellerOrderDashboard } from "@/components/sellers/seller-order-dashboard";

export default function SellerOrdersPage() {
  return (
    <SellerDashboardShell>
      <div className="mb-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Orders
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
          Fulfill your store order items
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          See only the products sold by your store, even when a buyer order contains items from other sellers.
        </p>
      </div>
      <SellerOrderDashboard />
    </SellerDashboardShell>
  );
}
