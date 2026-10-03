"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronRight,
  Crown,
  LogOut,
  Menu,
  RotateCcw,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { PORTAL_BY_ROLE, ROLE_LABEL, type AppRole } from "@/lib/roles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { MobileTabBar } from "@/components/MobileTabBar";
import { useConfirm, useToast } from "@/components/Feedback";
import { Avatar } from "@/components/ui";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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

function navItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  const depth = href.split("/").filter(Boolean).length;
  if (depth < 2) return false;
  return pathname.startsWith(`${href}/`);
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
  const { session, signOut, isMock, resetDemo } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const portalPrefix = PORTAL_BY_ROLE[role];

  async function onResetDemo() {
    const ok = await confirm({
      title: "Réinitialiser la démo ?",
      description:
        "Toutes les modifications (colis, tickets, paiements, utilisateurs) seront remplacées par les données de démonstration d'origine.",
      confirmLabel: "Réinitialiser",
      tone: "danger",
    });
    if (!ok) return;
    resetDemo();
    toast.success("Démo réinitialisée", "Les données d'origine sont restaurées.");
    router.refresh();
  }

  async function onSignOut() {
    await signOut();
    router.replace("/login");
  }

  const flatItems = useMemo<PortalNavItem[]>(() => {
    if (sections?.length) return sections.flatMap((s) => s.items);
    return links ?? [];
  }, [sections, links]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, search]);

  const roleLabel = ROLE_LABEL[role];
  const userName = session?.user.name ?? "";
  const firstName = userName.split(/\s+/)[0] || userName;

  const nav = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-umbrella.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-bold tracking-tight text-ops-ink">
              {title}
            </p>
            <p className="truncate text-[12px] text-ops-ink/45">{subtitle}</p>
          </div>
        </div>
        {isMock ? (
          <p className="mt-2.5 inline-flex rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-[#E1D2A7]">
            Mode démo
          </p>
        ) : null}
      </div>

      <nav className="portal-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3">
        <div className="space-y-0.5">
          {flatItems.map((item) => {
            const Icon = item.icon;
            const active = navItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition",
                  active
                    ? "bg-gradient-to-r from-ops-accent to-[#7f1d1d] text-white shadow-[0_0_20px_rgba(225,29,72,0.25)]"
                    : "text-ops-ink/55 hover:bg-ops-ink/[0.05] hover:text-ops-ink/90",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "opacity-100" : "opacity-80",
                  )}
                  strokeWidth={1.9}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="relative z-10 shrink-0 space-y-3 px-3 pb-3.5 pt-1">
        <div className="rounded-2xl border border-ops-accent/35 bg-ops-surface p-3.5 shadow-ops">
          <Crown
            className="h-5 w-5 text-amber-500"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="mt-2 text-[13px] font-bold leading-snug text-ops-ink">
            Passez au niveau supérieur
          </p>
          <p className="mt-1 text-[11px] leading-snug text-ops-ink/45">
            Plus de fonctionnalités pour développer votre activité.
          </p>
          <Link
            href="/tarifs"
            className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-ops-accent px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-ops-accent-soft"
          >
            Voir les offres
          </Link>
        </div>

        <Link
          href={`${portalPrefix}/settings`}
          className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-ops-ink/[0.04]"
        >
          <Avatar name={userName} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ops-ink">
              {firstName}
            </p>
            <p className="truncate text-[11px] text-ops-ink/45">{roleLabel}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ops-ink/35" aria-hidden />
        </Link>

        <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-[11px]">
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-1.5 text-ops-ink/45 transition hover:text-ops-ink/80"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
          {isMock ? (
            <button
              type="button"
              onClick={() => void onResetDemo()}
              className="inline-flex items-center gap-1.5 text-ops-ink/45 transition hover:text-ops-ink/80"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset démo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="portal-shell flex min-h-screen text-ops-ink">
      <aside className="portal-sidebar sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col overflow-hidden lg:flex">
        {nav}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="portal-sidebar relative flex h-full w-[280px] flex-col overflow-hidden shadow-soft">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-md p-2 text-ops-ink/70 hover:bg-ops-ink/10"
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
        <header className="portal-header sticky top-0 z-40 border-b backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 md:h-16 md:gap-4 md:px-6 lg:px-8">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ops-ink/80 transition hover:bg-ops-ink/[0.06] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:hidden">
              <Image
                src="/logo-umbrella.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold leading-tight">{title}</p>
                <p className="truncate text-[11px] text-ops-ink/50">{subtitle}</p>
              </div>
            </div>

            <form
              className="hidden min-w-0 max-w-xl flex-1 lg:block"
              action={`${portalPrefix}/parcels`}
              method="get"
              role="search"
            >
              <label className="sr-only" htmlFor="portal-search">
                Rechercher
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-ops-card bg-ops-ink/[0.04] px-3 py-2.5 transition focus-within:border-ops-ink/20 focus-within:bg-ops-ink/[0.06]">
                <Search className="h-4 w-4 shrink-0 text-ops-ink/35" aria-hidden />
                <input
                  id="portal-search"
                  name="q"
                  placeholder="Rechercher un colis, un client, une référence…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-ops-ink outline-none placeholder:text-ops-ink/30"
                />
                <kbd className="hidden rounded-md border border-ops-card bg-ops-ink/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-ops-ink/35 sm:inline">
                  Ctrl K
                </kbd>
              </div>
            </form>

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
              <span className="hidden lg:inline-flex">
                <ThemeToggle tone="on-dark" iconOnly />
              </span>
              {session ? (
                <NotificationsMenu
                  role={role}
                  userId={session.user.id}
                  portalPrefix={portalPrefix}
                  tone="on-dark"
                />
              ) : null}
              <Link
                href={`${portalPrefix}/settings`}
                className="inline-flex items-center gap-2 rounded-xl py-1 pl-1 pr-1.5 text-sm font-medium text-ops-ink/90 transition hover:bg-ops-ink/[0.06] sm:pr-2.5"
              >
                <Avatar name={userName} className="h-8 w-8" />
                <span className="flex max-w-[100px] flex-col leading-tight lg:hidden">
                  <span className="truncate text-[13px] font-semibold">{firstName}</span>
                  <span className="truncate text-[10px] text-ops-ink/50">{roleLabel}</span>
                </span>
                <span className="hidden max-w-[120px] truncate lg:inline">
                  {userName}
                </span>
              </Link>
            </div>
          </div>
        </header>
        <main className="w-full flex-1 overflow-x-hidden p-3 pb-20 text-ops-ink md:p-4 md:pb-20 lg:px-5 lg:py-3">
          {children}
        </main>
        <MobileTabBar role={role} />
      </div>
    </div>
  );
}
