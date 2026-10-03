"use client";

import { Home, Package, Settings } from "lucide-react";
import { RequireRole } from "@/components/RequireRole";
import type { PortalNavItem } from "@/components/PortalShell";

const links: PortalNavItem[] = [
  { href: "/livreur", label: "Accueil", icon: Home },
  { href: "/livreur/parcels", label: "Colis", icon: Package },
  { href: "/livreur/settings", label: "Paramètres", icon: Settings },
];

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
      links={links}
    >
      {children}
    </RequireRole>
  );
}
