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
      roles={["MAGASINIER"]}
      title={"Magasinier"}
      subtitle={"Dépôt et retours"}
      links={portalSidebarLinks("MAGASINIER")}
    >
      {children}
    </RequireRole>
  );
}
