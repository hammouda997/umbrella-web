"use client";

import { RequireRole } from "@/components/RequireRole";
import { portalSidebarLinks } from "@/lib/portal-nav-config";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["ADMIN"]}
      title="Admin"
      subtitle="Tableau de bord"
      links={portalSidebarLinks("ADMIN")}
    >
      {children}
    </RequireRole>
  );
}
