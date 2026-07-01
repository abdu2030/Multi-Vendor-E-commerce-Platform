import { ReactNode } from "react";
import { ProtectedDashboardLayout } from "@/components/auth/protected-dashboard-layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ProtectedDashboardLayout>{children}</ProtectedDashboardLayout>;
}
