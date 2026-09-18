"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { ROLE_LABEL, type AppRole } from "@/lib/roles";
import { ThemeToggle } from "@/components/ThemeToggle";

export type PortalNavChild = {
  href: string;
  label: string;
  color?: string;
};

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: PortalNavChild[];
  defaultOpen?: boolean;
};

export type PortalNavSection = {
  title: string;
  items: PortalNavItem[];
};

type PortalShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  role: AppRole;
  sections?: PortalNavSection[];
  links?: PortalNavItem[];
};

function linkActive(pathname: string, search: string, href: string) {
  const [path, query] = href.split("?");
  if (pathname !== path) return false;
  if (!query) return !search.includes("status=");
  return search.includes(query);
}

export function PortalShell({
  children,
  title,
  subtitle,
  sections,
  links,
  role,
}: PortalShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const router = useRouter();
  const { session, signOut, isMock } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navSections = useMemo<PortalNavSection[]>(() => {
    if (sections?.length) return sections;
    return [{ title: "Menu", items: links ?? [] }];
  }, [sections, links]);

  const openDefaults = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const section of navSections) {
      for (const item of section.items) {
        if (!item.children?.length) continue;
        const childHit = item.children.some((c) =>
          linkActive(pathname, search, c.href),
        );
        map[item.href] = childHit || Boolean(item.defaultOpen);
      }
    }
    return map;
  }, [navSections, pathname, search]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>(openDefaults);

  useEffect(() => {
    setOpenMap((prev) => {
      const next = { ...prev };
      for (const section of navSections) {
        for (const item of section.items) {
          if (!item.children?.length) continue;
          const childHit = item.children.some((c) =>
            linkActive(pathname, search, c.href),
          );
          if (childHit) next[item.href] = true;
        }
      }
      return next;
    });
  }, [navSections, pathname, search]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, search]);

  const roleLabel = ROLE_LABEL[role];
  const userName = session?.user.name ?? "";
  const userEmail = session?.user.email ?? "";
  const pageTitle =
    navSections
      .flatMap((s) => s.items)
      .flatMap((i) => [i, ...(i.children ?? []).map((c) => ({ ...i, ...c }))])
      .find((i) => linkActive(pathname, search, i.href))?.label ?? subtitle;

  const nav = (
    <>
      <div className="shrink-0 border-b border-white/10 px-4 py-5">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-umbrella.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 rounded-md object-contain"
          />
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-white">
              {title}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#E5DBD4]/80">
              {subtitle}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-white/55">{roleLabel}</p>
        {isMock ? (
          <p className="mt-2 inline-flex rounded bg-[#986A36]/25 px-2 py-0.5 text-[10px] font-semibold text-[#E1D2A7]">
            Mode démo
          </p>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C49A5A]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children?.length);
                const open = openMap[item.href] ?? false;
                const active =
                  !hasChildren && linkActive(pathname, search, item.href);

                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMap((m) => ({ ...m, [item.href]: !open }))
                        }
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                          open
                            ? "bg-white/10 text-white"
                            : "text-white/80 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition",
                            open ? "rotate-180" : "",
                          )}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                          active
                            ? "bg-[#CB3228] text-white shadow-sm"
                            : "text-white/80 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </Link>
                    )}

                    {hasChildren && open ? (
                      <div className="ml-2 mt-0.5 max-h-56 space-y-0.5 overflow-y-auto border-l border-white/10 pl-2">
                        {item.children?.map((child) => {
                          const childActive = linkActive(
                            pathname,
                            search,
                            child.href,
                          );
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition",
                                childActive
                                  ? "bg-[#CB3228] text-white"
                                  : "text-white/75 hover:bg-white/5 hover:text-white",
                              )}
                            >
                              {child.color ? (
                                <span
                                  className="h-2 w-2 shrink-0 rounded-sm"
                                  style={{ backgroundColor: child.color }}
                                />
                              ) : null}
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-4 py-4">
        <p className="truncate text-sm text-white">{userName}</p>
        <p className="truncate text-xs text-white/50">{userEmail}</p>
        <Link
          href={`${PORTAL_PREFIX[role]}/settings`}
          className="mt-2 block text-xs text-[#E5DBD4]/80 hover:text-white"
        >
          Profil & paramètres
        </Link>
        <button
          type="button"
          onClick={() => {
            void signOut().then(() => router.replace("/login"));
          }}
          className="mt-3 inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="portal-sidebar hidden w-[260px] shrink-0 flex-col lg:flex">
        {nav}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="portal-sidebar relative flex h-full w-[280px] flex-col shadow-soft">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-md p-2 text-white/70 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-cream bg-surface px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cream text-ink lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-ink">{pageTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              className="relative rounded-lg border border-cream p-2 text-ink-muted hover:text-brand"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
            </button>
            <p className="hidden text-sm text-ink md:block">{userName}</p>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

const PORTAL_PREFIX: Record<AppRole, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  EXPEDITEUR: "/expediteur",
  LIVREUR: "/livreur",
  CLIENT: "/client",
};
