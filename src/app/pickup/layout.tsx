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
      roles={["PICKUP"]}
      title={"Pickup"}
      subtitle={"Enlèvement expéditeur"}
      links={portalSidebarLinks("PICKUP")}
    >
      {children}
    </RequireRole>
  );
}
