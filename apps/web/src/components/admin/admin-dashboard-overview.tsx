"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  BadgeCheck,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Shield,
  ShoppingBag,
  Truck,
  Users
} from "@/components/imported/design-icons";
import { AdminDashboardStats, getAdminDashboardStats } from "@/lib/admin-dashboard";

type ChartRow = {
  label: string;
  value: number;
  tone: string;
};

export function AdminDashboardOverview() {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "ADMIN";

  const loadStats = useCallback(async () => {
    if (!accessToken || !isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setStats(await getAdminDashboardStats(accessToken));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Admin dashboard stats could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAdmin]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const updatedAt = useMemo(() => {
    if (!stats?.generatedAt) {
      return "Not loaded";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(stats.generatedAt));
  }, [stats?.generatedAt]);

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Admin only</p>
        <h2 className="mt-2 text-2xl font-extrabold text-stone-900">Dashboard analytics are restricted</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">Use an admin account to view marketplace analytics.</p>
      </section>
    );
  }

  if (isLoading && !stats) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        <span className="inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Loading admin dashboard...
        </span>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">Admin analytics</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">Marketplace health</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-500">
              Monitor user growth, seller readiness, catalog status, order flow, revenue, and approval queues.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-extrabold text-stone-500">
              Updated {updatedAt}
            </span>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-extrabold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void loadStats()}
              type="button"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {stats ? <DashboardContent stats={stats} /> : null}
    </div>
  );
}

function DashboardContent({ stats }: { stats: AdminDashboardStats }) {
  const approvalRows = [
    { label: "Seller applications", value: stats.pendingApprovals.sellerApplications, tone: "bg-amber-500" },
    { label: "Product reviews", value: stats.pendingApprovals.products, tone: "bg-emerald-500" }
  ];
  const userRows = [
    { label: "Buyers", value: stats.users.byRole.BUYER, tone: "bg-emerald-500" },
    { label: "Pending sellers", value: stats.users.byRole.PENDING_SELLER, tone: "bg-amber-500" },
    { label: "Sellers", value: stats.users.byRole.SELLER, tone: "bg-sky-500" },
    { label: "Admins", value: stats.users.byRole.ADMIN, tone: "bg-stone-700" },
    { label: "Support", value: stats.users.byRole.SUPPORT, tone: "bg-indigo-500" }
  ];
  const sellerRows = [
    { label: "Approved", value: stats.sellers.approved, tone: "bg-emerald-500" },
    { label: "Pending", value: stats.sellers.pending, tone: "bg-amber-500" },
    { label: "Rejected", value: stats.sellers.rejected, tone: "bg-red-500" },
    { label: "Suspended", value: stats.sellers.suspended, tone: "bg-stone-500" }
  ];
  const productRows = [
    { label: "Approved", value: stats.products.approved, tone: "bg-emerald-500" },
    { label: "Pending review", value: stats.products.pendingReview, tone: "bg-amber-500" },
    { label: "Draft", value: stats.products.draft, tone: "bg-stone-400" },
    { label: "Rejected", value: stats.products.rejected, tone: "bg-red-500" },
    { label: "Archived", value: stats.products.archived, tone: "bg-stone-600" }
  ];
  const orderRows = [
    { label: "Pending", value: stats.orders.pending, tone: "bg-amber-500" },
    { label: "Paid", value: stats.orders.paid, tone: "bg-emerald-500" },
    { label: "Processing", value: stats.orders.processing, tone: "bg-sky-500" },
    { label: "Shipped", value: stats.orders.shipped, tone: "bg-indigo-500" },
    { label: "Delivered", value: stats.orders.delivered, tone: "bg-teal-500" },
    { label: "Cancelled", value: stats.orders.cancelled, tone: "bg-red-500" },
    { label: "Refunded", value: stats.orders.refunded, tone: "bg-stone-500" }
  ];
  const revenueRows = stats.revenue.byCurrency.map((row) => ({
    label: row.currency,
    value: row.totalCents,
    tone: "bg-emerald-500"
  }));

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard Icon={Users} label="Users" value={formatCount(stats.users.total)} helper={`${stats.users.byRole.BUYER} buyers`} />
        <SummaryCard Icon={Shield} label="Sellers" value={formatCount(stats.sellers.total)} helper={`${stats.sellers.approved} approved`} />
        <SummaryCard Icon={ShoppingBag} label="Products" value={formatCount(stats.products.total)} helper={`${stats.products.pendingReview} pending`} />
        <SummaryCard Icon={Truck} label="Orders" value={formatCount(stats.orders.total)} helper={`${stats.orders.paid + stats.orders.processing + stats.orders.shipped} active`} />
        <SummaryCard Icon={CreditCard} label="Revenue" value={formatMoney(stats.revenue.totalPaidCents, stats.revenue.currency)} helper={`${stats.revenue.paidPaymentCount} paid payments`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Approval queue" eyebrow="Pending work" Icon={BadgeCheck} actionHref="/dashboard/admin/seller-applications" actionLabel="Review sellers">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700">Total pending</p>
              <p className="mt-2 text-3xl font-extrabold text-stone-950">{stats.pendingApprovals.total}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Sellers</p>
              <p className="mt-2 text-3xl font-extrabold text-stone-950">{stats.pendingApprovals.sellerApplications}</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">Products</p>
              <p className="mt-2 text-3xl font-extrabold text-stone-950">{stats.pendingApprovals.products}</p>
            </div>
          </div>
          <BarChart rows={approvalRows} total={Math.max(stats.pendingApprovals.total, 1)} />
        </Panel>

        <Panel title="Revenue" eyebrow="Paid payments" Icon={CreditCard}>
          <p className="text-3xl font-extrabold text-stone-950">{formatMoney(stats.revenue.totalPaidCents, stats.revenue.currency)}</p>
          <p className="mt-1 text-sm font-semibold text-stone-500">{stats.revenue.paidPaymentCount} successful payment{stats.revenue.paidPaymentCount === 1 ? "" : "s"}</p>
          {revenueRows.length > 0 ? (
            <CurrencyChart rows={revenueRows} />
          ) : (
            <EmptyChart label="No paid revenue yet" />
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Orders by status" eyebrow="Fulfillment" Icon={Truck}>
          <BarChart rows={orderRows} total={Math.max(stats.orders.total, 1)} />
        </Panel>
        <Panel title="Products by status" eyebrow="Catalog" Icon={Package} actionHref="/dashboard/admin/products" actionLabel="Review products">
          <BarChart rows={productRows} total={Math.max(stats.products.total, 1)} />
        </Panel>
        <Panel title="Users by role" eyebrow="Accounts" Icon={Users}>
          <BarChart rows={userRows} total={Math.max(stats.users.total, 1)} />
        </Panel>
        <Panel title="Sellers by status" eyebrow="Seller health" Icon={Shield}>
          <BarChart rows={sellerRows} total={Math.max(stats.sellers.total, 1)} />
        </Panel>
      </section>
    </>
  );
}

function SummaryCard({ Icon, label, value, helper }: { Icon: React.FC<{ className?: string }>; label: string; value: string; helper: string }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-stone-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-stone-500">{helper}</p>
        </div>
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function Panel({
  Icon,
  actionHref,
  actionLabel,
  children,
  eyebrow,
  title
}: {
  Icon: React.FC<{ className?: string }>;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-stone-600">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">{eyebrow}</p>
            <h3 className="mt-1 text-lg font-extrabold text-stone-950">{title}</h3>
          </div>
        </div>
        {actionHref && actionLabel ? (
          <Link className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-extrabold text-stone-600 transition hover:border-stone-300 hover:text-stone-950" href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function BarChart({ rows, total }: { rows: ChartRow[]; total: number }) {
  return (
    <div className="mt-5 grid gap-3">
      {rows.map((row) => {
        const width = Math.max(0, Math.min(100, Math.round((row.value / total) * 100)));

        return (
          <div className="grid gap-1.5" key={row.label}>
            <div className="flex items-center justify-between gap-3 text-xs font-bold">
              <span className="text-stone-600">{row.label}</span>
              <span className="text-stone-950">{formatCount(row.value)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-100" aria-label={`${row.label}: ${row.value}`}>
              <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CurrencyChart({ rows }: { rows: ChartRow[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="mt-5 grid gap-3">
      {rows.map((row) => {
        const width = Math.max(0, Math.min(100, Math.round((row.value / max) * 100)));

        return (
          <div className="grid gap-1.5" key={row.label}>
            <div className="flex items-center justify-between gap-3 text-xs font-bold">
              <span className="text-stone-600">{row.label}</span>
              <span className="text-stone-950">{formatMoney(row.value, row.label)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-100" aria-label={`${row.label}: ${row.value}`}>
              <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="mt-5 flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-stone-500">
      <Clock className="h-4 w-4 text-stone-400" />
      {label}
    </div>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}
