"use client";

import {
  BookUser,
  ChartColumn,
  LayoutDashboard,
  Package,
  PlusCircle,
  RotateCcw,
  Search,
  Settings,
  Ticket,
  Wallet,
} from "lucide-react";
import { RequireRole } from "@/components/RequireRole";
import { colisNavChildren } from "@/lib/portal-nav";
import type { PortalNavSection } from "@/components/PortalShell";

const sections: PortalNavSection[] = [
  {
    title: "Colis",
    items: [
      { href: "/expediteur", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/expediteur/analytics", label: "Analytics", icon: ChartColumn },
      {
        href: "/expediteur/parcels",
        label: "Mes colis",
        icon: Package,
        defaultOpen: false,
        children: [
          { href: "/expediteur/parcels", label: "Tous les colis" },
          ...colisNavChildren("/expediteur").filter((c) =>
            c.href.includes("status="),
          ),
        ],
      },
      { href: "/expediteur/nouveau", label: "Ajouter colis", icon: PlusCircle },
      { href: "/expediteur/recherche", label: "Rechercher", icon: Search },
      { href: "/expediteur/retours", label: "Mes retours", icon: RotateCcw },
    ],
  },
  {
    title: "Compte",
    items: [
      { href: "/expediteur/payments", label: "Paiements / Soldes", icon: Wallet },
      { href: "/expediteur/tickets", label: "Tickets", icon: Ticket },
      { href: "/expediteur/adresses", label: "Carnet d'adresses", icon: BookUser },
      { href: "/expediteur/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

export default function ExpediteurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole
      roles={["EXPEDITEUR"]}
      title="Umbrella"
      subtitle="Expéditeur"
      sections={sections}
    >
      {children}
    </RequireRole>
  );
}
