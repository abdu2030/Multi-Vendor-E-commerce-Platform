"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { BadgeCheck, Save } from "@/components/imported/design-icons";
import {
  SellerStoreSettings,
  StoreSettingsInput,
  getStoreSettings,
  updateStoreSettings,
} from "@/lib/seller-dashboard";

type FormState = {
  name: string;
  description: string;
  phone: string;
  bio: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  phone: "",
  bio: "",
};

export function StoreSettingsForm() {
  const { accessToken } = useAuth();
  const [settings, setSettings] = useState<SellerStoreSettings | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    getStoreSettings(accessToken)
      .then((data) => {
        setSettings(data);
        setForm({
          name: data.store.name,
          description: data.store.description,
          phone: data.sellerProfile.phone ?? "",
          bio: data.sellerProfile.bio ?? "",
        });
      })
      .catch((caughtError) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Store settings could not load.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateStoreSettings(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!accessToken) {
      setError("Your session has expired. Please login again.");
      return;
    }

    const payload: StoreSettingsInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      phone: form.phone.trim() || undefined,
      bio: form.bio.trim() || undefined,
    };

    setIsSubmitting(true);

    try {
      const updated = await updateStoreSettings(payload, accessToken);
      setSettings(updated);
      setSuccess("Store settings saved.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Store settings could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-white p-5 text-sm font-bold text-stone-500 shadow-sm">
        Loading store settings...
      </p>
    );
  }

  if (!settings && error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {error}
      </p>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Store name">
          <input
            className={inputClass}
            onChange={(event) => updateField("name", event.target.value)}
            type="text"
            value={form.name}
          />
        </Field>
        <Field label="Seller phone">
          <input
            className={inputClass}
            onChange={(event) => updateField("phone", event.target.value)}
            type="tel"
            value={form.phone}
          />
        </Field>
      </div>

      <Field label="Store description">
        <textarea
          className={`${inputClass} min-h-36 py-3 leading-relaxed`}
          onChange={(event) => updateField("description", event.target.value)}
          rows={5}
          value={form.description}
        />
      </Field>

      <Field label="Seller bio">
        <textarea
          className={`${inputClass} min-h-28 py-3 leading-relaxed`}
          onChange={(event) => updateField("bio", event.target.value)}
          rows={3}
          value={form.bio}
        />
      </Field>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <BadgeCheck className="h-4 w-4" />
          {success}
        </p>
      ) : null}

      <button
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={isSubmitting}
        type="submit"
      >
        <Save className="h-4 w-4" />
        {isSubmitting ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 min-h-12";

function validateStoreSettings(form: FormState) {
  if (form.name.trim().length < 3) {
    return "Store name must be at least 3 characters.";
  }

  if (form.description.trim().length < 10) {
    return "Store description must be at least 10 characters.";
  }

  if (form.phone.trim() && form.phone.trim().length < 7) {
    return "Seller phone must be at least 7 characters.";
  }

  return "";
}
