"use client";

import dynamic from "next/dynamic";
import { OpsDashboardLoader } from "@/components/OpsDashboardLoader";

const AdminNavexDashboard = dynamic(
  () =>
    import("@/components/AdminNavexDashboard").then(
      (m) => m.AdminNavexDashboard,
    ),
  {
    ssr: false,
    loading: () => <OpsDashboardLoader />,
  },
);

export default function SuperAdminDashboardPage() {
  return <AdminNavexDashboard basePath="/super-admin" role="SUPER_ADMIN" />;
}
