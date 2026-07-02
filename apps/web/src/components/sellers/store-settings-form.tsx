"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getStoreSettings,
  SellerStoreSettings,
  StoreSettingsInput,
  updateStoreSettings
} from "@/lib/seller-dashboard";

type FormState = {
  name: string;
  description: string;
  phone: string;
  bio: string;
  logoUrl: string;
  bannerUrl: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  phone: "",
  bio: "",
  logoUrl: "",
  bannerUrl: ""
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
          logoUrl: data.store.logoUrl ?? "",
          bannerUrl: data.store.bannerUrl ?? ""
        });
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Store settings could not load.");
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
      logoUrl: form.logoUrl.trim() || undefined,
      bannerUrl: form.bannerUrl.trim() || undefined
    };

    setIsSubmitting(true);

    try {
      const updated = await updateStoreSettings(payload, accessToken);
      setSettings(updated);
      setSuccess("Store settings saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Store settings could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="muted-text">Loading store settings...</p>;
  }

  if (!settings && error) {
    return <p className="form-error">{error}</p>;
  }

  return (
    <form className="seller-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Store name</span>
          <input
            onChange={(event) => updateField("name", event.target.value)}
            type="text"
            value={form.name}
          />
        </label>
        <label>
          <span>Seller phone</span>
          <input
            onChange={(event) => updateField("phone", event.target.value)}
            type="tel"
            value={form.phone}
          />
        </label>
      </div>
      <label>
        <span>Store description</span>
        <textarea
          onChange={(event) => updateField("description", event.target.value)}
          rows={5}
          value={form.description}
        />
      </label>
      <label>
        <span>Seller bio</span>
        <textarea
          onChange={(event) => updateField("bio", event.target.value)}
          rows={3}
          value={form.bio}
        />
      </label>
      <div className="form-grid">
        <label>
          <span>Logo URL</span>
          <input
            onChange={(event) => updateField("logoUrl", event.target.value)}
            type="url"
            value={form.logoUrl}
          />
        </label>
        <label>
          <span>Banner URL</span>
          <input
            onChange={(event) => updateField("bannerUrl", event.target.value)}
            type="url"
            value={form.bannerUrl}
          />
        </label>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}

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

  for (const [label, value] of [
    ["Logo URL", form.logoUrl],
    ["Banner URL", form.bannerUrl]
  ] as const) {
    if (!value.trim()) {
      continue;
    }

    try {
      const url = new URL(value.trim());

      if (!["http:", "https:"].includes(url.protocol)) {
        return `${label} must start with http or https.`;
      }
    } catch {
      return `${label} must be a valid URL.`;
    }
  }

  return "";
}
