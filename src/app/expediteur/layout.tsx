"use client";

import { RequireRole } from "@/components/RequireRole";
import { portalSidebarLinks } from "@/lib/portal-nav-config";

export default function ExpediteurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["EXPEDITEUR"]}
      title="Expéditeur"
      subtitle="Tableau de bord"
      links={portalSidebarLinks("EXPEDITEUR")}
    >
      {children}
    </RequireRole>
  );
}
