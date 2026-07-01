import Link from "next/link";

export default function SellerApplicationPendingPage() {
  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <p style={styles.badge}>Awaiting seller approval</p>
        <h1 style={styles.title}>Your seller application is under review.</h1>
        <p style={styles.copy}>
          Admins review store details before seller tools are unlocked. You can still browse products as a buyer while your store is waiting for approval.
        </p>
        <div style={styles.timeline}>
          <div style={styles.stepDone}>
            <strong>Application submitted</strong>
            <span>Saved 30 seconds ago</span>
          </div>
          <div style={styles.stepActive}>
            <strong>Admin review</strong>
            <span>We check store details, contact info, and business document links.</span>
          </div>
          <div style={styles.step}>
            <strong>Seller access</strong>
            <span>Approved sellers can create store profiles and products.</span>
          </div>
        </div>
        <div style={styles.actions}>
          <Link href="/seller/apply" style={styles.secondaryButton}>
            Update application
          </Link>
          <Link href="/" style={styles.primaryButton}>
            Back to marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 40px)",
    display: "grid",
    placeItems: "center",
    padding: 24
  },
  panel: {
    width: "min(760px, 100%)",
    padding: 32,
    background: "#ffffff",
    border: "1px solid #e7ded2",
    borderRadius: 8,
    boxShadow: "0 18px 50px rgba(23, 33, 29, 0.08)"
  },
  badge: {
    display: "inline-block",
    margin: 0,
    padding: "6px 10px",
    borderRadius: 6,
    color: "#9a3412",
    background: "#ffedd5",
    fontWeight: 800,
    fontSize: 14
  },
  title: {
    margin: "20px 0 0",
    fontSize: "clamp(2rem, 5vw, 3rem)",
    lineHeight: 1.1
  },
  copy: {
    margin: "16px 0 0",
    color: "#5f574f",
    lineHeight: 1.7,
    fontSize: 17
  },
  timeline: {
    display: "grid",
    gap: 12,
    marginTop: 28
  },
  stepDone: {
    padding: 16,
    borderRadius: 8,
    background: "#ecfdf5",
    color: "#065f46",
    display: "grid",
    gap: 4
  },
  stepActive: {
    padding: 16,
    borderRadius: 8,
    background: "#eff6ff",
    color: "#1e3a8a",
    display: "grid",
    gap: 4
  },
  step: {
    padding: 16,
    borderRadius: 8,
    background: "#f5f5f4",
    color: "#44403c",
    display: "grid",
    gap: 4
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 28
  },
  primaryButton: {
    padding: "12px 16px",
    borderRadius: 8,
    color: "#ffffff",
    background: "#1f9d72",
    fontWeight: 800,
    textDecoration: "none"
  },
  secondaryButton: {
    padding: "12px 16px",
    borderRadius: 8,
    color: "#17211d",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    fontWeight: 800,
    textDecoration: "none"
  }
} as const;
