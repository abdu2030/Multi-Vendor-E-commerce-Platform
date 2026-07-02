"use client";

import { SellerDashboardShell } from "@/components/sellers/seller-dashboard-shell";
import { SellerOverview } from "@/components/sellers/seller-overview";

export default function SellerDashboardPage() {
  return (
    <SellerDashboardShell>
      <div className="workflow-heading">
        <div>
          <p className="eyebrow">Seller dashboard</p>
          <h2>Store overview</h2>
        </div>
      </div>
      <SellerOverview />
    </SellerDashboardShell>
  );
}
