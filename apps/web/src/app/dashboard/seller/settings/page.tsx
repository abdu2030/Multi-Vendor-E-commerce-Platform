"use client";

import { StoreSettingsForm } from "@/components/sellers/store-settings-form";
import { SellerDashboardShell } from "@/components/sellers/seller-dashboard-shell";

export default function StoreSettingsPage() {
  return (
    <SellerDashboardShell>
      <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
            Store settings
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-stone-900">
            Manage storefront details
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
            Update the storefront data served by the seller store settings API.
          </p>
        </div>
        <StoreSettingsForm />
      </section>
    </SellerDashboardShell>
  );
}
