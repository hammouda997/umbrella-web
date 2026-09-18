"use client";

import { Package, Route, Settings } from "lucide-react";
import { RequireRole } from "@/components/RequireRole";

const links = [
  { href: "/livreur", label: "Ma tournée", icon: Route },
  { href: "/livreur/parcels", label: "Tous les colis", icon: Package },
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
      title="Umbrella"
      subtitle="Portail Livreur"
      links={links}
    >
      {children}
    </RequireRole>
  );
}
