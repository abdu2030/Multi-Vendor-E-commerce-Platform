"use client";

import { AdminSellerApprovalTable } from "@/components/admin/admin-seller-approval-table";

export default function AdminSellerApplicationsPage() {
  return (
    <section className="workflow-panel wide-panel">
      <div className="workflow-heading">
        <div>
          <p className="eyebrow">Admin review</p>
          <h2>Seller approvals</h2>
        </div>
      </div>
      <AdminSellerApprovalTable />
    </section>
  );
}
