"use client";

import { Home, Package, Settings, Ticket } from "lucide-react";
import { RequireRole } from "@/components/RequireRole";

const links = [
  { href: "/client", label: "Accueil", icon: Home },
  { href: "/client/parcels", label: "Colis", icon: Package },
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
      title="Client"
      subtitle="Tableau de bord"
      links={links}
    >
      {children}
    </RequireRole>
  );
}
