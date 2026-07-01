import Link from "next/link";
import { SellerApplicationForm } from "@/components/seller-application-form";

export default function SellerApplyPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Seller application</p>
        <h1 style={styles.title}>Apply to become a seller</h1>
        <p style={styles.copy}>
          Share your store details for admin review. Approved sellers can create a store profile, add products, upload images, and manage their own orders.
        </p>
        <Link href="/seller/application/pending" style={styles.link}>
          Already applied? View pending status
        </Link>
      </section>
      <SellerApplicationForm />
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1120,
    margin: "0 auto",
    padding: "48px 24px",
    display: "grid",
    gap: 32
  },
  hero: {
    maxWidth: 760
  },
  eyebrow: {
    margin: 0,
    color: "#1f9d72",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0
  },
  title: {
    margin: "12px 0 0",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    lineHeight: 1.05
  },
  copy: {
    margin: "16px 0 0",
    color: "#5f574f",
    lineHeight: 1.7,
    fontSize: 18
  },
  link: {
    display: "inline-block",
    marginTop: 18,
    color: "#2563eb",
    fontWeight: 800
  }
} as const;
