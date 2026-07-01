"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
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
        setError(caughtError instanceof Error ? caughtError.message : "Profile could not load.");
      });
  }, [accessToken]);

  return (
    <section className="profile-panel">
      <p className="eyebrow">User profile</p>
      <h2>{profile?.fullName}</h2>
      {error ? <p className="form-error">{error}</p> : null}
      <dl className="profile-list">
        <div>
          <dt>Email</dt>
          <dd>{profile?.email}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{profile?.role}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{profile?.phone || "Not added"}</dd>
        </div>
      </dl>
    </section>
  );
}
