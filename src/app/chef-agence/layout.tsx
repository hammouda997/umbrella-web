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
      roles={["CHEF_AGENCE"]}
      title={"Chef d'agence"}
      subtitle={"Agence gouvernorat"}
      links={portalSidebarLinks("CHEF_AGENCE")}
    >
      {children}
    </RequireRole>
  );
}
