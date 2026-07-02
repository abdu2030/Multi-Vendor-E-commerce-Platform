"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { createSellerApplication } from "@/lib/seller-applications";

type FormState = {
  storeName: string;
  storeDescription: string;
  phone: string;
  address: string;
  businessDocument: string;
};

const initialState: FormState = {
  storeName: "",
  storeDescription: "",
  phone: "",
  address: "",
  businessDocument: ""
};

export function SellerApplicationForm() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validationError = validateSellerApplication(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!accessToken) {
      setError("Your session has expired. Please login again.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createSellerApplication(
        {
          storeName: form.storeName.trim(),
          storeDescription: form.storeDescription.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          businessDocument: form.businessDocument.trim() || undefined
        },
        accessToken
      );
      router.replace("/dashboard/seller/status");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Seller application could not be submitted."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="seller-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Store name</span>
          <input
            name="storeName"
            onChange={(event) => updateField("storeName", event.target.value)}
            placeholder="Example Market"
            type="text"
            value={form.storeName}
          />
        </label>
        <label>
          <span>Business phone</span>
          <input
            name="phone"
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+1 555 000 0000"
            type="tel"
            value={form.phone}
          />
        </label>
      </div>
      <label>
        <span>Store description</span>
        <textarea
          name="storeDescription"
          onChange={(event) => updateField("storeDescription", event.target.value)}
          placeholder="Tell us what you sell, who you serve, and what makes your store reliable."
          rows={5}
          value={form.storeDescription}
        />
      </label>
      <label>
        <span>Business address</span>
        <textarea
          name="address"
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="Street, city, region, country"
          rows={3}
          value={form.address}
        />
      </label>
      <label>
        <span>Business document URL</span>
        <input
          name="businessDocument"
          onChange={(event) => updateField("businessDocument", event.target.value)}
          placeholder="https://example.com/document.pdf"
          type="url"
          value={form.businessDocument}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Submit application"}
      </button>
    </form>
  );
}

function validateSellerApplication(form: FormState) {
  if (form.storeName.trim().length < 3) {
    return "Store name must be at least 3 characters.";
  }

  if (form.storeDescription.trim().length < 20) {
    return "Store description must be at least 20 characters.";
  }

  if (form.phone.trim().length < 7) {
    return "Business phone must be at least 7 characters.";
  }

  if (form.address.trim().length < 5) {
    return "Business address must be at least 5 characters.";
  }

  if (form.businessDocument.trim()) {
    try {
      const url = new URL(form.businessDocument.trim());

      if (!["http:", "https:"].includes(url.protocol)) {
        return "Business document URL must start with http or https.";
      }
    } catch {
      return "Business document must be a valid URL.";
    }
  }

  return "";
}
