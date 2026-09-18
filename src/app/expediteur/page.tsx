"use client";

import dynamic from "next/dynamic";

const AdminNavexDashboard = dynamic(
  () =>
    import("@/components/AdminNavexDashboard").then(
      (m) => m.AdminNavexDashboard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded bg-surface" />
        ))}
      </div>
    ),
  },
);

export default function ExpediteurPage() {
  return <AdminNavexDashboard basePath="/expediteur" variant="sender" />;
}
