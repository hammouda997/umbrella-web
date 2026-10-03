"use client";

import { RequireRole } from "@/components/RequireRole";
import { portalSidebarLinks } from "@/lib/portal-nav-config";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SUPER_ADMIN"]}
      title="Super Admin"
      subtitle="Tableau de bord"
      links={portalSidebarLinks("SUPER_ADMIN")}
    >
      {children}
    </RequireRole>
  );
}
