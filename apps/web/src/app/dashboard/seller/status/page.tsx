"use client";

import Link from "next/link";
import { SellerApplicationStatus } from "@/components/sellers/seller-application-status";

export default function SellerStatusPage() {
  return (
    <section className="workflow-panel">
      <div className="workflow-heading">
        <div>
          <p className="eyebrow">Application status</p>
          <h2>Seller review</h2>
        </div>
        <Link className="secondary-button" href="/dashboard/seller/apply">
          Apply
        </Link>
      </div>
      <SellerApplicationStatus />
    </section>
  );
}
