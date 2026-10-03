"use client";

import {
  BarChart3,
  CreditCard,
  Home,
  Package,
  Settings,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { RequireRole } from "@/components/RequireRole";
import type { PortalNavItem } from "@/components/PortalShell";

const links: PortalNavItem[] = [
  { href: "/expediteur", label: "Accueil", icon: Home },
  { href: "/expediteur/parcels", label: "Colis", icon: Package },
  { href: "/expediteur/payments", label: "Paiements", icon: CreditCard },
  { href: "/expediteur/retours", label: "Livraisons", icon: Truck },
  { href: "/expediteur/adresses", label: "Clients", icon: Users },
  { href: "/expediteur/analytics", label: "Rapports", icon: BarChart3 },
  { href: "/expediteur/nouveau", label: "Entrepôt", icon: Warehouse },
  { href: "/expediteur/settings", label: "Paramètres", icon: Settings },
];

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
      links={links}
    >
      {children}
    </RequireRole>
  );
}
