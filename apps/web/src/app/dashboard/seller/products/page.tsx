"use client";

import { SellerDashboardShell } from "@/components/sellers/seller-dashboard-shell";
import { SellerProductManager } from "@/components/sellers/seller-product-manager";

export default function SellerProductsPage() {
  return (
    <SellerDashboardShell>
      <div className="mb-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          Products
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
          Create and manage catalog items
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Create draft products, upload Cloudinary images, edit product details,
          and submit items for review from your seller workspace.
        </p>
      </div>
      <SellerProductManager />
    </SellerDashboardShell>
  );
}
