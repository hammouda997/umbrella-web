"use client";

import { RequireRole } from "@/components/RequireRole";
import { portalSidebarLinks } from "@/lib/portal-nav-config";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SUPPORT"]}
      title={"Support"}
      subtitle={"Vérification retours"}
      links={portalSidebarLinks("SUPPORT")}
    >
      {children}
    </RequireRole>
  );
}
