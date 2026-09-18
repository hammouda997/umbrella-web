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
      { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
      {
        href: "/admin/parcels",
        label: "Colis",
        icon: Package,
        defaultOpen: false,
        children: [
          { href: "/admin/parcels", label: "Tous les colis" },
          ...colisNavChildren("/admin").filter((c) =>
            c.href.includes("status="),
          ),
        ],
      },
      { href: "/admin/nouveau", label: "Ajouter colis", icon: PlusCircle },
      { href: "/admin/dispatch", label: "Dispatch", icon: Truck },
      { href: "/admin/bordereau", label: "Bordereau", icon: Printer },
    ],
  },
  {
    title: "Finance & support",
    items: [
      { href: "/admin/payments", label: "Paiements", icon: Wallet },
      { href: "/admin/caissier", label: "Caisse COD", icon: Banknote },
      { href: "/admin/tickets", label: "Tickets", icon: Ticket },
    ],
  },
  {
    title: "Réseau",
    items: [
      { href: "/admin/zones", label: "Zones", icon: MapPinned },
      { href: "/admin/flotte", label: "Flotte", icon: Truck },
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["ADMIN"]}
      title="Umbrella"
      subtitle="Admin Ops"
      sections={sections}
    >
      {children}
    </RequireRole>
  );
}
