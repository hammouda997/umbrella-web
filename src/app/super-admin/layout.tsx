"use client";

import {
  Banknote,
  ChartColumn,
  LayoutDashboard,
  MapPinned,
  Package,
  PlusCircle,
  Printer,
  Truck,
  Users,
  Ticket,
  Wallet,
} from "lucide-react";
import { RequireRole } from "@/components/RequireRole";
import { colisNavChildren } from "@/lib/portal-nav";
import type { PortalNavSection } from "@/components/PortalShell";

const sections: PortalNavSection[] = [
  {
    title: "Ops",
    items: [
      { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/super-admin/analytics", label: "Analytics", icon: ChartColumn },
      {
        href: "/super-admin/parcels",
        label: "Colis",
        icon: Package,
        defaultOpen: false,
        children: [
          { href: "/super-admin/parcels", label: "Tous les colis" },
          ...colisNavChildren("/super-admin").filter((c) =>
            c.href.includes("status="),
          ),
        ],
      },
      {
        href: "/super-admin/nouveau",
        label: "Ajouter colis",
        icon: PlusCircle,
      },
      { href: "/super-admin/dispatch", label: "Dispatch", icon: Truck },
      { href: "/super-admin/bordereau", label: "Bordereau", icon: Printer },
    ],
  },
  {
    title: "Finance & support",
    items: [
      { href: "/super-admin/payments", label: "Paiements", icon: Wallet },
      { href: "/super-admin/caissier", label: "Caisse COD", icon: Banknote },
      { href: "/super-admin/tickets", label: "Tickets", icon: Ticket },
    ],
  },
  {
    title: "Réseau",
    items: [
      { href: "/super-admin/zones", label: "Zones", icon: MapPinned },
      { href: "/super-admin/flotte", label: "Flotte", icon: Truck },
      { href: "/super-admin/users", label: "Utilisateurs", icon: Users },
    ],
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["SUPER_ADMIN"]}
      title="Umbrella"
      subtitle="Super Admin"
      sections={sections}
    >
      {children}
    </RequireRole>
  );
}
