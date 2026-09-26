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
import type { PortalNavSection } from "@/components/PortalShell";

const sections: PortalNavSection[] = [
  {
    title: "Colis",
    items: [
      { href: "/expediteur", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/expediteur/parcels", label: "Mes colis", icon: Package },
      { href: "/expediteur/nouveau", label: "Nouveau colis", icon: PlusCircle },
      { href: "/expediteur/recherche", label: "Rechercher", icon: Search },
      { href: "/expediteur/retours", label: "Mes retours", icon: RotateCcw },
      { href: "/expediteur/analytics", label: "Analytics", icon: ChartColumn },
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
