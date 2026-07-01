"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitSellerApplication, type SellerApplicationPayload } from "@/lib/api";

type FormErrors = Partial<Record<keyof SellerApplicationPayload, string>>;

const initialForm: SellerApplicationPayload = {
  storeName: "",
  storeDescription: "",
  phone: "",
  address: "",
  businessDocument: ""
};

function validateForm(form: SellerApplicationPayload) {
  const errors: FormErrors = {};

  if (form.storeName.trim().length < 3) {
    errors.storeName = "Store name must be at least 3 characters.";
  }

  if (form.storeDescription.trim().length < 20) {
    errors.storeDescription = "Store description must explain your store in at least 20 characters.";
  }

  if (form.phone.trim().length < 7) {
    errors.phone = "Enter a reachable phone number.";
  }

  if (form.address.trim().length < 8) {
    errors.address = "Enter the store address or operating location.";
  }

  if (form.businessDocument && !form.businessDocument.startsWith("http")) {
    errors.businessDocument = "Use a valid document URL, or leave this blank.";
  }

  return errors;
}

export function SellerApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingDescription = useMemo(
    () => Math.max(20 - form.storeDescription.trim().length, 0),
    [form.storeDescription]
  );

  function updateField(field: keyof SellerApplicationPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const application = await submitSellerApplication({
        ...form,
        businessDocument: form.businessDocument?.trim() || undefined
      });
      window.localStorage.setItem("sellerApplication", JSON.stringify(application));
      router.push("/seller/application/pending");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Seller application could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate style={styles.form}>
      <div>
        <label htmlFor="storeName" style={styles.label}>
          Store name
        </label>
        <input
          id="storeName"
          value={form.storeName}
          onChange={(event) => updateField("storeName", event.target.value)}
          placeholder="Mira Home Studio"
          style={styles.input}
          aria-invalid={Boolean(errors.storeName)}
          aria-describedby={errors.storeName ? "storeName-error" : undefined}
        />
        {errors.storeName ? <p id="storeName-error" style={styles.error}>{errors.storeName}</p> : null}
      </div>

      <div>
        <label htmlFor="storeDescription" style={styles.label}>
          Store description
        </label>
        <textarea
          id="storeDescription"
          value={form.storeDescription}
          onChange={(event) => updateField("storeDescription", event.target.value)}
          placeholder="Tell admins what you sell, who you serve, and what makes your store trustworthy."
          rows={6}
          style={{ ...styles.input, resize: "vertical" }}
          aria-invalid={Boolean(errors.storeDescription)}
          aria-describedby={errors.storeDescription ? "storeDescription-error" : undefined}
        />
        {remainingDescription > 0 ? (
          <p style={styles.hint}>{remainingDescription} more characters needed.</p>
        ) : (
          <p style={styles.hint}>Looks detailed enough for review.</p>
        )}
        {errors.storeDescription ? (
          <p id="storeDescription-error" style={styles.error}>{errors.storeDescription}</p>
        ) : null}
      </div>

      <div style={styles.grid}>
        <div>
          <label htmlFor="phone" style={styles.label}>
            Phone
          </label>
          <input
            id="phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+1 555 0142"
            style={styles.input}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone ? <p id="phone-error" style={styles.error}>{errors.phone}</p> : null}
        </div>

        <div>
          <label htmlFor="businessDocument" style={styles.label}>
            Business document URL
          </label>
          <input
            id="businessDocument"
            value={form.businessDocument}
            onChange={(event) => updateField("businessDocument", event.target.value)}
            placeholder="https://example.com/document.pdf"
            style={styles.input}
            aria-invalid={Boolean(errors.businessDocument)}
            aria-describedby={errors.businessDocument ? "businessDocument-error" : undefined}
          />
          {errors.businessDocument ? (
            <p id="businessDocument-error" style={styles.error}>{errors.businessDocument}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="address" style={styles.label}>
          Store address
        </label>
        <input
          id="address"
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="City, region, country"
          style={styles.input}
          aria-invalid={Boolean(errors.address)}
          aria-describedby={errors.address ? "address-error" : undefined}
        />
        {errors.address ? <p id="address-error" style={styles.error}>{errors.address}</p> : null}
      </div>

      {serverError ? <p role="alert" style={styles.serverError}>{serverError}</p> : null}

      <button disabled={isSubmitting} type="submit" style={styles.button}>
        {isSubmitting ? "Submitting application..." : "Submit seller application"}
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "grid",
    gap: 20,
    maxWidth: 760,
    padding: 24,
    background: "#ffffff",
    border: "1px solid #e7ded2",
    borderRadius: 8,
    boxShadow: "0 18px 50px rgba(23, 33, 29, 0.08)"
  },
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: 700
  },
  input: {
    width: "100%",
    border: "1px solid #d8cec1",
    borderRadius: 8,
    padding: "12px 14px",
    color: "#17211d",
    background: "#fffaf5"
  },
  hint: {
    margin: "8px 0 0",
    color: "#6b6259",
    fontSize: 14
  },
  error: {
    margin: "8px 0 0",
    color: "#b42318",
    fontSize: 14,
    fontWeight: 700
  },
  serverError: {
    margin: 0,
    padding: 12,
    color: "#8a1f11",
    background: "#fff0ed",
    borderRadius: 8,
    fontWeight: 700
  },
  button: {
    width: "fit-content",
    border: 0,
    borderRadius: 8,
    padding: "12px 18px",
    color: "#ffffff",
    background: "#1f9d72",
    fontWeight: 800,
    cursor: "pointer"
  }
} as const;
