import type { NextConfig } from "next";
import path from "node:path";

validatePublicEnvironment();

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  poweredByHeader: false
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