"use client";

import { LayoutDashboard, Package, Settings, Ticket } from "lucide-react";
import { RequireRole } from "@/components/RequireRole";

const links = [
  { href: "/client", label: "Mes livraisons", icon: LayoutDashboard },
  { href: "/client/parcels", label: "Historique", icon: Package },
  { href: "/client/tickets", label: "Tickets", icon: Ticket },
  { href: "/client/settings", label: "Paramètres", icon: Settings },
];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["CLIENT"]}
      title="Umbrella"
      subtitle="Portail Client"
      links={links}
    >
      {children}
    </RequireRole>
  );
}
