import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="home-panel">
        <p className="eyebrow">Marketplace workspace</p>
        <h1>MultiVendor Marketplace</h1>
        <p>
          Sign in to continue to your protected dashboard, or create a buyer account to begin.
        </p>
        <div className="button-row">
          <Link className="primary-button" href="/login">
            Login
          </Link>
          <Link className="secondary-button" href="/register">
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
