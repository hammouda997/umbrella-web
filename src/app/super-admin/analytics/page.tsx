"use client";

import dynamic from "next/dynamic";

const AnalyticsPage = dynamic(
  () => import("@/components/AnalyticsPage").then((m) => m.AnalyticsPage),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    ),
  },
);

export default function SuperAdminAnalyticsRoute() {
  return <AnalyticsPage basePath="/super-admin" />;
}
