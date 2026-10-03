"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Home,
  Package,
  ScanLine,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PORTAL_BY_ROLE, type AppRole } from "@/lib/roles";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

function tabsForRole(role: AppRole): Tab[] {
  const base = PORTAL_BY_ROLE[role];

  const home: Tab = {
    href: base,
    label: "Accueil",
    icon: Home,
    match: (p) => p === base,
  };

  const colis: Tab = {
    href: `${base}/parcels`,
    label: "Colis",
    icon: Package,
  };

  const scanner: Tab = {
    href: `${base}/scanner`,
    label: "Scanner",
    icon: ScanLine,
  };

  const profil: Tab = {
    href: `${base}/settings`,
    label: "Profil",
    icon: UserRound,
  };

  if (role === "LIVREUR") {
    return [
      home,
      colis,
      scanner,
      {
        href: `${base}/settings`,
        label: "Paiements",
        icon: CreditCard,
        match: () => false,
      },
      profil,
    ];
  }

  if (role === "CLIENT") {
    return [
      home,
      colis,
      scanner,
      {
        href: `${base}/tickets`,
        label: "Paiements",
        icon: CreditCard,
      },
      profil,
    ];
  }

  return [
    home,
    colis,
    scanner,
    {
      href: `${base}/payments`,
      label: "Paiements",
      icon: CreditCard,
    },
    profil,
  ];
}

function isActive(pathname: string, tab: Tab, tabs: Tab[]) {
  if (tab.match) return tab.match(pathname);
  if (pathname === tab.href) return true;
  if (tab.href === tabs[0]?.href) return false;
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function MobileTabBar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const tabs = tabsForRole(role);

  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ops-ink/10 bg-ops-page/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab, tabs);
          return (
            <li key={`${tab.label}-${tab.href}`}>
              <Link
                href={tab.href}
                className={cn(
                  "relative flex min-h-[3.75rem] flex-col items-center justify-center gap-1 px-1 py-2.5 text-[12px] font-semibold tracking-wide transition",
                  active
                    ? "text-ops-accent"
                    : "text-ops-ink/55 hover:text-ops-ink/85",
                )}
              >
                <Icon className="h-7 w-7" strokeWidth={active ? 2.4 : 2} />
                <span>{tab.label}</span>
                {active ? (
                  <span
                    className="absolute bottom-0 h-0.5 w-8 rounded-full bg-ops-accent"
                    aria-hidden
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
