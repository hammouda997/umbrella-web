"use client";

import { RequireRole } from "@/components/RequireRole";
import { portalSidebarLinks } from "@/lib/portal-nav-config";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["CLIENT"]}
      title="Client"
      subtitle="Tableau de bord"
      links={portalSidebarLinks("CLIENT")}
    >
      {children}
    </RequireRole>
  );
}
