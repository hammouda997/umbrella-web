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
  { href: "/super-admin", label: "Accueil", icon: Home },
  { href: "/super-admin/parcels", label: "Colis", icon: Package },
  { href: "/super-admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/super-admin/dispatch", label: "Livraisons", icon: Truck },
  { href: "/super-admin/users", label: "Clients", icon: Users },
  { href: "/super-admin/analytics", label: "Rapports", icon: BarChart3 },
  { href: "/super-admin/zones", label: "Entrepôt", icon: Warehouse },
  { href: "/super-admin/settings", label: "Paramètres", icon: Settings },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SUPER_ADMIN"]}
      title="Super Admin"
      subtitle="Tableau de bord"
      links={links}
    >
      {children}
    </RequireRole>
  );
}
