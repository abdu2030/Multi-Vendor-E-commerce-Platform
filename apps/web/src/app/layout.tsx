import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "MultiVendor Marketplace",
  description: "Multi-vendor e-commerce platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
