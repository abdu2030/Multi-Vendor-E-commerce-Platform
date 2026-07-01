export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ fontWeight: 700, color: "#1f9d72" }}>Week 1 Day 1 Setup</p>
      <h1>MultiVendor Marketplace</h1>
      <p>
        Frontend scaffold is ready. The seller application form and pending status page are now available for the current assignment.
      </p>
      <a href="/seller/apply" style={{ color: "#2563eb", fontWeight: 700 }}>
        Apply to become a seller
      </a>
    </main>
  );
}
