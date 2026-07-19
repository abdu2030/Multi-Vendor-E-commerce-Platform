"use client";

import Link from "next/link";
import type { FC } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Package,
  Shield,
  ShoppingBag,
  Truck,
} from "@/components/imported/design-icons";
import { CommerceOrbitScene } from "@/components/marketplace/commerce-orbit-scene";

export default function DashboardPage() {
  const { user } = useAuth();
  const actions = getWorkspaceActions(user?.role);

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl">
        <img
          alt="Marketplace operations workspace"
          className="absolute inset-0 h-full w-full object-cover opacity-35 saturate-150"
          src="/images/seller-studio.webp"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.38),transparent_34%),radial-gradient(circle_at_84%_24%,rgba(251,113,133,0.32),transparent_31%),linear-gradient(120deg,rgba(2,6,23,0.94),rgba(15,23,42,0.74))]" />
        <CommerceOrbitScene className="pointer-events-none absolute inset-y-0 right-[-26%] z-0 h-full w-[80vw] opacity-70 sm:right-[-16%] lg:right-[-8%] lg:w-[48vw]" />

        <div className="relative z-10 grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-10">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-200 backdrop-blur">
              Marketplace workspace
            </p>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Welcome back, {user?.fullName}.
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-slate-200 sm:text-base">
              Manage buyer, seller, and admin workflows from one authenticated dashboard. The shortcuts below reflect your current account permissions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryAction href="/products" label="Browse live catalog" />
              <SecondaryAction href="/dashboard/orders" label="View orders" />
              {user?.role === "SELLER" ? <SecondaryAction href="/dashboard/seller" label="Open seller tools" /> : null}
              {user?.role === "ADMIN" ? <SecondaryAction href="/dashboard/admin" label="Open admin overview" /> : null}
            </div>
          </div>

          <div className="self-end rounded-[1.75rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <Shield className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-widest text-cyan-200">
              Secure session
            </p>
            <h3 className="mt-2 text-xl font-black">{formatRole(user?.role)} access</h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">
              Routes and actions are guarded by the backend and filtered by your verified role.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {actions.map((action) => (
          <WorkspaceActionCard key={action.href} {...action} />
        ))}
      </section>
    </div>
  );
}

function PrimaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-amber-300"
      href={href}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function SecondaryAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white backdrop-blur transition hover:border-cyan-200 hover:bg-white/15"
      href={href}
    >
      {label}
    </Link>
  );
}

function WorkspaceActionCard({
  Icon,
  label,
  title,
  body,
  href,
  tone,
}: {
  Icon: FC<{ className?: string }>;
  label: string;
  title: string;
  body: string;
  href: string;
  tone: "cyan" | "rose" | "amber";
}) {
  const toneClass = tone === "cyan" ? "bg-cyan-100 text-cyan-700" : tone === "rose" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";

  return (
    <Link className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl" href={href}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">{title}</h3>
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold leading-relaxed text-slate-500">{body}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-500 transition group-hover:text-slate-950">
        Open
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function getWorkspaceActions(role: string | undefined) {
  const base = [
    {
      Icon: ShoppingBag,
      label: "Catalog",
      title: "Products",
      body: "Browse approved products from the live marketplace catalog.",
      href: "/products",
      tone: "cyan" as const,
    },
    {
      Icon: Truck,
      label: "Purchases",
      title: "Orders",
      body: "Open your authenticated order history and fulfillment state.",
      href: "/dashboard/orders",
      tone: "amber" as const,
    },
  ];

  if (role === "SELLER") {
    return [
      ...base,
      {
        Icon: Package,
        label: "Seller",
        title: "Store tools",
        body: "Manage your seller dashboard, listings, orders, and store settings.",
        href: "/dashboard/seller",
        tone: "rose" as const,
      },
    ];
  }

  if (role === "ADMIN") {
    return [
      ...base,
      {
        Icon: BadgeCheck,
        label: "Admin",
        title: "Approvals",
        body: "Review seller applications, product moderation, categories, and platform orders.",
        href: "/dashboard/admin",
        tone: "rose" as const,
      },
    ];
  }

  return [
    ...base,
    {
      Icon: FileText,
      label: "Seller",
      title: "Apply",
      body: "Submit or review the seller application connected to your account.",
      href: "/dashboard/seller/apply",
      tone: "rose" as const,
    },
  ];
}

function formatRole(role: string | undefined) {
  return (role ?? "Buyer").replace("_", " ").toLowerCase();
}
