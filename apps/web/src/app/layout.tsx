import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
