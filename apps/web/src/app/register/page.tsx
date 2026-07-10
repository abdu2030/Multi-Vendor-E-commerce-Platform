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

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      router.replace("/dashboard");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Registration failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF8F4] px-4 py-8 text-stone-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full min-w-0 grid-cols-[minmax(0,1fr)] max-w-6xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl lg:grid-cols-[1fr_500px]">
        <section className="relative isolate hidden flex-col justify-between overflow-hidden bg-stone-900 p-10 text-white lg:flex">
          <img
            alt="Independent seller managing orders in her studio"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            src="/images/seller-studio.webp"
          />
          <div className="absolute inset-0 -z-10 bg-stone-950/75" />
          <div className="relative z-10">
            <Link className="flex items-center gap-2" href="/">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
                <Package className="h-4 w-4" />
              </span>
              <span className="font-extrabold">Marketo</span>
            </Link>
          </div>

          <div className="relative z-10 max-w-lg">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              Buyer account
            </p>
            <h1 className="text-4xl font-extrabold leading-tight">
              Create an account and continue into the marketplace workspace.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-400">
              Start as a buyer, then submit a seller application from your
              dashboard whenever your store is ready.
            </p>
          </div>

          <div className="relative z-10 grid gap-3">
            {[
              ["Buyer dashboard", "Profile and protected account access"],
              ["Seller application", "Submit store details after registration"],
              ["Approval status", "Track admin decisions from your workspace"],
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

        <section className="flex min-w-0 items-center p-6 sm:p-10">
          <div className="w-full min-w-0">
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
                Create account
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">
                Join Marketo
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Register a buyer account. Seller tools are available after you
                apply and get approved.
              </p>
            </div>

            <form
              className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4"
              onSubmit={handleSubmit}
            >
              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-bold text-stone-700">
                  Full name
                </span>
                <input
                  autoComplete="name"
                  className="h-12 w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  name="fullName"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  type="text"
                  value={fullName}
                />
              </label>

              <label className="grid min-w-0 gap-2">
                <span className="text-sm font-bold text-stone-700">Email</span>
                <input
                  autoComplete="email"
                  className="h-12 w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </label>

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-bold text-stone-700">
                    Phone
                  </span>
                  <input
                    autoComplete="tel"
                    className="h-12 w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="phone"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Optional"
                    type="tel"
                    value={phone}
                  />
                </label>

                <label className="grid min-w-0 gap-2">
                  <span className="text-sm font-bold text-stone-700">
                    Password
                  </span>
                  <input
                    autoComplete="new-password"
                    className="h-12 w-full min-w-0 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="8+ characters"
                    type="password"
                    value={password}
                  />
                </label>
              </div>

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
                {isSubmitting ? "Creating account..." : "Create account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>Your password is hashed by the API before storage.</p>
            </div>

            <p className="mt-8 text-center text-sm text-stone-500">
              Already have an account?{" "}
              <Link
                className="font-extrabold text-emerald-700 hover:text-emerald-900"
                href="/login"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
