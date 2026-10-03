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
  { href: "/admin", label: "Accueil", icon: Home },
  { href: "/admin/parcels", label: "Colis", icon: Package },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/dispatch", label: "Livraisons", icon: Truck },
  { href: "/admin/users", label: "Clients", icon: Users },
  { href: "/admin/analytics", label: "Rapports", icon: BarChart3 },
  { href: "/admin/zones", label: "Entrepôt", icon: Warehouse },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["ADMIN"]}
      title="Admin"
      subtitle="Tableau de bord"
      links={links}
    >
      {children}
    </RequireRole>
  );
}
