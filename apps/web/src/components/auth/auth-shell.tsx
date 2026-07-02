import Link from "next/link";
import { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-stage">
        <div className="auth-aside">
          <Link className="brand-link" href="/">
            MultiVendor
          </Link>
          <div>
            <p className="eyebrow">Secure access</p>
            <h2>Use the workspace for buyer, seller, and admin workflows.</h2>
          </div>
          <div className="auth-context-list">
            <div>
              <span>Auth</span>
              <strong>Access and refresh tokens</strong>
            </div>
            <div>
              <span>Sellers</span>
              <strong>Applications and approval status</strong>
            </div>
            <div>
              <span>Admin</span>
              <strong>Decision history and audit logs</strong>
            </div>
          </div>
        </div>
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-heading">
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
          <div className="auth-footer">{footer}</div>
        </section>
      </section>
    </main>
  );
}
