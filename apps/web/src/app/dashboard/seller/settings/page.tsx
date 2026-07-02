"use client";

import { SellerDashboardShell } from "@/components/sellers/seller-dashboard-shell";
import { StoreSettingsForm } from "@/components/sellers/store-settings-form";

export default function StoreSettingsPage() {
  return (
    <SellerDashboardShell>
      <div className="workflow-heading">
        <div>
          <p className="eyebrow">Store settings</p>
          <h2>Manage storefront details</h2>
        </div>
      </div>
      <StoreSettingsForm />
    </SellerDashboardShell>
  );
}
