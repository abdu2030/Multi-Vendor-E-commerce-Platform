const overviewCards = [
  {
    label: "Store status",
    value: "Awaiting approval",
    detail: "Your store is waiting for admin approval."
  },
  {
    label: "Products",
    value: "0",
    detail: "No products yet. Add your first product to start selling."
  },
  {
    label: "Orders",
    value: "0",
    detail: "Seller orders appear after payment confirmation."
  },
  {
    label: "Inventory alerts",
    value: "0",
    detail: "Low stock warnings will appear here."
  }
];

const navigationItems = ["Overview", "Store settings", "Products", "Orders", "Inventory"];

export function SellerDashboardShell() {
  return (
    <main className="seller-dashboard-shell" style={styles.shell}>
      <aside className="seller-dashboard-sidebar" style={styles.sidebar}>
        <div>
          <p style={styles.logo}>MultiVendor</p>
          <p style={styles.sidebarHint}>Seller workspace</p>
        </div>
        <nav style={styles.nav} aria-label="Seller dashboard navigation">
          {navigationItems.map((item, index) => (
            <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} style={index === 0 ? styles.navActive : styles.navItem}>
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section style={styles.content}>
        <header className="seller-dashboard-header" style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Seller dashboard</p>
            <h1 style={styles.title}>Build your store with confidence</h1>
            <p style={styles.copy}>
              Your store is almost ready. Complete the settings below while admins review your seller application.
            </p>
          </div>
          <span style={styles.statusBadge}>Awaiting seller approval</span>
        </header>

        <section id="overview" style={styles.cards} aria-label="Seller overview">
          {overviewCards.map((card) => (
            <article key={card.label} style={styles.card}>
              <p style={styles.cardLabel}>{card.label}</p>
              <strong style={styles.cardValue}>{card.value}</strong>
              <span style={styles.cardDetail}>{card.detail}</span>
            </article>
          ))}
        </section>

        <section className="seller-dashboard-main-grid" style={styles.grid}>
          <article style={styles.panel}>
            <p style={styles.panelEyebrow}>Store readiness</p>
            <h2 style={styles.panelTitle}>Approval checklist</h2>
            <div style={styles.checklist}>
              {[
                ["Seller application submitted", true],
                ["Admin review in progress", true],
                ["Store profile completed", false],
                ["First product added", false]
              ].map(([label, complete]) => (
                <label key={String(label)} style={styles.checkItem}>
                  <input type="checkbox" checked={Boolean(complete)} readOnly />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </article>

          <article id="store-settings" style={styles.panel}>
            <p style={styles.panelEyebrow}>Store settings</p>
            <h2 style={styles.panelTitle}>Store profile</h2>
            <form style={styles.form}>
              <label style={styles.label}>
                Store display name
                <input style={styles.input} placeholder="Mira Home Studio" />
              </label>
              <label style={styles.label}>
                Store description
                <textarea
                  style={styles.textarea}
                  rows={5}
                  placeholder="Describe your products, service style, and what buyers can expect."
                />
              </label>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  Support phone
                  <input style={styles.input} placeholder="+1 555 0142" />
                </label>
                <label style={styles.label}>
                  Store location
                  <input style={styles.input} placeholder="City, country" />
                </label>
              </div>
              <button type="button" style={styles.saveButton}>
                Save store settings
              </button>
              <p style={styles.savedNote}>Saved 30 seconds ago</p>
            </form>
          </article>
        </section>
      </section>
    </main>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(220px, 280px) 1fr",
    background: "#fffaf5"
  },
  sidebar: {
    position: "sticky",
    top: 0,
    height: "100vh",
    padding: 24,
    background: "#17211d",
    color: "#fffaf5",
    display: "flex",
    flexDirection: "column",
    gap: 36
  },
  logo: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900
  },
  sidebarHint: {
    margin: "6px 0 0",
    color: "#d7e7dd",
    fontSize: 14
  },
  nav: {
    display: "grid",
    gap: 8
  },
  navItem: {
    padding: "11px 12px",
    borderRadius: 8,
    color: "#e9f5ee",
    textDecoration: "none",
    fontWeight: 700
  },
  navActive: {
    padding: "11px 12px",
    borderRadius: 8,
    color: "#17211d",
    background: "#fbbf24",
    textDecoration: "none",
    fontWeight: 900
  },
  content: {
    padding: "40px 28px",
    display: "grid",
    gap: 28
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "start"
  },
  eyebrow: {
    margin: 0,
    color: "#1f9d72",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0
  },
  title: {
    margin: "10px 0 0",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    lineHeight: 1.05
  },
  copy: {
    maxWidth: 720,
    margin: "14px 0 0",
    color: "#5f574f",
    lineHeight: 1.7,
    fontSize: 17
  },
  statusBadge: {
    borderRadius: 8,
    padding: "9px 12px",
    color: "#9a3412",
    background: "#ffedd5",
    fontWeight: 900,
    whiteSpace: "nowrap"
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 16
  },
  card: {
    padding: 18,
    borderRadius: 8,
    background: "#ffffff",
    border: "1px solid #e7ded2",
    boxShadow: "0 12px 32px rgba(23, 33, 29, 0.06)"
  },
  cardLabel: {
    margin: 0,
    color: "#6b6259",
    fontWeight: 800,
    fontSize: 14
  },
  cardValue: {
    display: "block",
    marginTop: 10,
    fontSize: 30
  },
  cardDetail: {
    display: "block",
    marginTop: 8,
    color: "#5f574f",
    lineHeight: 1.45,
    fontSize: 14
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(260px, 0.75fr) minmax(320px, 1.25fr)",
    gap: 18,
    alignItems: "start"
  },
  panel: {
    padding: 22,
    borderRadius: 8,
    background: "#ffffff",
    border: "1px solid #e7ded2",
    boxShadow: "0 12px 32px rgba(23, 33, 29, 0.06)"
  },
  panelEyebrow: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0,
    fontSize: 13
  },
  panelTitle: {
    margin: "8px 0 0",
    fontSize: 24
  },
  checklist: {
    display: "grid",
    gap: 12,
    marginTop: 18
  },
  checkItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#44403c",
    fontWeight: 700
  },
  form: {
    display: "grid",
    gap: 16,
    marginTop: 18
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 14
  },
  label: {
    display: "grid",
    gap: 8,
    color: "#332f2b",
    fontWeight: 800
  },
  input: {
    width: "100%",
    border: "1px solid #d8cec1",
    borderRadius: 8,
    padding: "12px 14px",
    background: "#fffaf5"
  },
  textarea: {
    width: "100%",
    border: "1px solid #d8cec1",
    borderRadius: 8,
    padding: "12px 14px",
    background: "#fffaf5",
    resize: "vertical"
  },
  saveButton: {
    width: "fit-content",
    border: 0,
    borderRadius: 8,
    padding: "12px 16px",
    color: "#ffffff",
    background: "#1f9d72",
    fontWeight: 900,
    cursor: "pointer"
  },
  savedNote: {
    margin: 0,
    color: "#6b6259",
    fontSize: 14
  }
} as const;
