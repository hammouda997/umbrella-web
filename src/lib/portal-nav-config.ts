import {
  BarChart3,
  Box,
  CreditCard,
  Home,
  MapPin,
  Package,
  Palette,
  RefreshCw,
  ScanLine,
  Settings,
  Ticket,
  Truck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { PORTAL_BY_ROLE, type AppRole } from "@/lib/roles";

export type PortalNavDef = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown as a primary bottom-tab item on mobile. */
  mobilePrimary?: boolean;
};

export function portalNavFor(role: AppRole): PortalNavDef[] {
  const base = PORTAL_BY_ROLE[role];

  if (role === "LIVREUR") {
    return [
      { href: base, label: "Accueil", icon: Home, mobilePrimary: true },
      {
        href: `${base}/parcels`,
        label: "Colis",
        icon: Package,
        mobilePrimary: true,
      },
      {
        href: `${base}/scanner`,
        label: "Scanner",
        icon: ScanLine,
        mobilePrimary: true,
      },
      {
        href: `${base}/settings`,
        label: "Profil",
        icon: Settings,
        mobilePrimary: true,
      },
    ];
  }

  if (role === "CLIENT") {
    return [
      { href: base, label: "Accueil", icon: Home, mobilePrimary: true },
      {
        href: `${base}/parcels`,
        label: "Colis",
        icon: Package,
        mobilePrimary: true,
      },
      {
        href: `${base}/scanner`,
        label: "Scanner",
        icon: ScanLine,
        mobilePrimary: true,
      },
      {
        href: `${base}/tickets`,
        label: "Tickets",
        icon: Ticket,
        mobilePrimary: true,
      },
      {
        href: `${base}/settings`,
        label: "Profil",
        icon: Settings,
        mobilePrimary: true,
      },
    ];
  }

  if (role === "EXPEDITEUR") {
    return [
      { href: base, label: "Accueil", icon: Home, mobilePrimary: true },
      {
        href: `${base}/parcels`,
        label: "Colis",
        icon: Package,
        mobilePrimary: true,
      },
      {
        href: `${base}/nouveau`,
        label: "Nouveau",
        icon: Box,
        mobilePrimary: true,
      },
      {
        href: `${base}/scanner`,
        label: "Scanner",
        icon: ScanLine,
        mobilePrimary: true,
      },
      { href: `${base}/payments`, label: "Paiements", icon: CreditCard },
      { href: `${base}/retours`, label: "Retours", icon: RefreshCw },
      { href: `${base}/adresses`, label: "Adresses", icon: MapPin },
      { href: `${base}/analytics`, label: "Rapports", icon: BarChart3 },
      { href: `${base}/settings`, label: "Paramètres", icon: Settings },
    ];
  }

  // ADMIN + SUPER_ADMIN
  const items: PortalNavDef[] = [
    { href: base, label: "Accueil", icon: Home, mobilePrimary: true },
    {
      href: `${base}/parcels`,
      label: "Colis",
      icon: Package,
      mobilePrimary: true,
    },
    {
      href: `${base}/scanner`,
      label: "Scanner",
      icon: ScanLine,
      mobilePrimary: true,
    },
    {
      href: `${base}/dispatch`,
      label: "Livraisons",
      icon: Truck,
      mobilePrimary: true,
    },
    { href: `${base}/payments`, label: "Paiements", icon: CreditCard },
    { href: `${base}/users`, label: "Utilisateurs", icon: Users },
    { href: `${base}/analytics`, label: "Rapports", icon: BarChart3 },
    { href: `${base}/zones`, label: "Entrepôt", icon: Warehouse },
  ];

  if (role === "SUPER_ADMIN") {
    items.push({
      href: `${base}/categories`,
      label: "Catégories",
      icon: Palette,
    });
  }

  items.push({ href: `${base}/settings`, label: "Paramètres", icon: Settings });
  return items;
}

export function portalSidebarLinks(role: AppRole): PortalNavDef[] {
  return portalNavFor(role);
}

export function portalMobilePrimary(role: AppRole): PortalNavDef[] {
  return portalNavFor(role).filter((item) => item.mobilePrimary);
}

export function portalMobileMore(role: AppRole): PortalNavDef[] {
  return portalNavFor(role).filter((item) => !item.mobilePrimary);
}
