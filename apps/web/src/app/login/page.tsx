"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  ArrowRight,
  BadgeCheck,
  Package,
  Shield,
} from "@/components/imported/design-icons";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn({ email: email.trim(), password });
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Login failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] px-4 py-8 text-stone-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl lg:grid-cols-[1fr_460px]">
        <section className="hidden flex-col justify-between bg-stone-900 p-10 text-white lg:flex">
          <div>
            <Link className="flex items-center gap-2" href="/">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
                <Package className="h-4 w-4" />
              </span>
              <span className="font-extrabold">Marketo</span>
            </Link>
          </div>

          <div className="max-w-lg">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              Marketplace workspace
            </p>
            <h1 className="text-4xl font-extrabold leading-tight">
              Sign in to manage orders, sellers, products, and approvals.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              Use your buyer, seller, or admin account to continue where you
              left off.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              ["Secure session", "JWT access and refresh token flow"],
              ["Verified sellers", "Approval workflow and audit trail"],
              ["Admin ready", "Seller review tools and moderation views"],
            ].map(([title, body]) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-stone-400">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10">
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <Link className="flex items-center gap-2" href="/">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Package className="h-4 w-4" />
                </span>
                <span className="font-extrabold">Marketo</span>
              </Link>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                Welcome back
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">
                Sign in
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Access your marketplace dashboard with your registered email and
                password.
              </p>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-stone-700">Email</span>
                <input
                  autoComplete="email"
                  className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-stone-700">
                  Password
                </span>
                <input
                  autoComplete="current-password"
                  className="h-12 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </label>

              {error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              ) : null}

              <button
                className="mt-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Keep the API server running on port 5000 while signing in
                locally.
              </p>
            </div>

            <p className="mt-8 text-center text-sm text-stone-500">
              New here?{" "}
              <Link
                className="font-extrabold text-emerald-700 hover:text-emerald-900"
                href="/register"
              >
                Create an account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
