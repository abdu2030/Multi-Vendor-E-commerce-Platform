import type { NextConfig } from "next";
import path from "node:path";

validatePublicEnvironment();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders()
      }
    ];
  }
};

export default nextConfig;

function validatePublicEnvironment() {
  const forbiddenPublicNamePattern = /(SECRET|PASSWORD|TOKEN|DATABASE|REDIS|STRIPE|WEBHOOK|CLOUDINARY_API)/i;
  const unsafeKeys = Object.keys(process.env).filter(
    (key) => key.startsWith("NEXT_PUBLIC_") && forbiddenPublicNamePattern.test(key)
  );

  if (unsafeKeys.length > 0) {
    throw new Error(
      `Refusing to expose secret-like public environment variables: ${unsafeKeys.join(", ")}`
    );
  }
}

function securityHeaders() {
  const apiOrigin = getApiOrigin();
  const isDevelopment = process.env.NODE_ENV !== "production";
  const scriptSrc = ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])];
  const connectSrc = ["'self'", apiOrigin].filter(Boolean);
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc.join(" ")}`,
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"])
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" }
  ];
}

function getApiOrigin() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return "http://localhost:5000";
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    return "";
  }
}
