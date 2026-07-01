"use client";

import { useAuth } from "@/components/auth/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-grid">
      <section className="metric-card">
        <p className="eyebrow">Account</p>
        <h2>{user?.role ?? "Buyer"}</h2>
        <p>Your dashboard access is protected by the API token issued at login.</p>
      </section>
      <section className="metric-card">
        <p className="eyebrow">Profile</p>
        <h2>{user?.email}</h2>
        <p>Profile details are restored from `/api/auth/me` when the app reloads.</p>
      </section>
      <section className="metric-card">
        <p className="eyebrow">Session</p>
        <h2>Active</h2>
        <p>Refresh token storage is ready for longer-lived authenticated sessions.</p>
      </section>
    </div>
  );
}
