import { AdminSellerApprovalTable } from "@/components/admin-seller-approval-table";

export default function AdminSellerApprovalsPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Admin</p>
        <h1 style={styles.title}>Seller approvals</h1>
        <p style={styles.copy}>
          Review seller applications, approve stores that are ready, or return clear rejection reasons when details need work.
        </p>
      </section>
      <AdminSellerApprovalTable />
    </main>
  );
}

const styles = {
  page: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "48px 24px",
    display: "grid",
    gap: 28
  },
  hero: {
    maxWidth: 780
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
  }
} as const;
