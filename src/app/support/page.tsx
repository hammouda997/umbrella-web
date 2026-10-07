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

export default function SupportDashboardPage() {
  return <AdminNavexDashboard basePath="/support" role="SUPPORT" />;
}
