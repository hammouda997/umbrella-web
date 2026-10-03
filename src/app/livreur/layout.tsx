"use client";

import { RequireRole } from "@/components/RequireRole";
import { portalSidebarLinks } from "@/lib/portal-nav-config";

export default function LivreurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["LIVREUR"]}
      title="Livreur"
      subtitle="Tableau de bord"
      links={portalSidebarLinks("LIVREUR")}
    >
      {children}
    </RequireRole>
  );
}
