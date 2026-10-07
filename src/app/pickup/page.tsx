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

export default function PickupDashboardPage() {
  return <AdminNavexDashboard basePath="/pickup" role="PICKUP" />;
}
