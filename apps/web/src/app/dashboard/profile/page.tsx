"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { BadgeCheck, Shield, Users } from "@/components/imported/design-icons";
import { apiRequest } from "@/lib/api";
import { AuthUser } from "@/lib/auth";

export default function ProfilePage() {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    apiRequest<AuthUser>("/users/profile", { token: accessToken })
      .then(setProfile)
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Profile could not load.",
        );
      });
  }, [accessToken]);

  return (
    <section className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl font-extrabold text-white">
          {initials(profile?.fullName ?? "")}
        </div>
        <h2 className="mt-5 text-2xl font-extrabold text-stone-900">
          {profile?.fullName}
        </h2>
        <p className="mt-1 text-sm font-semibold text-stone-400">
          {profile?.email}
        </p>
        <span className="mt-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
          {profile?.role.replace("_", " ")}
        </span>
      </aside>

      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
            User profile
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-stone-900">
            Protected account details
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            This page confirms the `/users/profile` route and authenticated
            profile loading are connected to the new workspace.
          </p>
        </div>

        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <ProfileCell Icon={Users} label="Full name" value={profile?.fullName} />
          <ProfileCell Icon={Shield} label="Email" value={profile?.email} />
          <ProfileCell Icon={BadgeCheck} label="Role" value={profile?.role} />
          <ProfileCell
            Icon={Shield}
            label="Phone"
            value={profile?.phone || "Not added"}
          />
        </dl>
      </div>
    </section>
  );
}

function ProfileCell({
  Icon,
  label,
  value,
}: {
  Icon: React.FC<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-stone-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <dd className="mt-2 overflow-hidden text-ellipsis text-sm font-bold text-stone-800">
        {value}
      </dd>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
