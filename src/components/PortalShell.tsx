"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LogOut, Menu, RotateCcw, Settings, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { PORTAL_BY_ROLE, ROLE_LABEL, type AppRole } from "@/lib/roles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationsMenu } from "@/components/NotificationsMenu";
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

  const navSections = useMemo<PortalNavSection[]>(() => {
    if (sections?.length) return sections;
    return [{ title: "Menu", items: links ?? [] }];
  }, [sections, links]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, search]);

  const roleLabel = ROLE_LABEL[role];
  const userName = session?.user.name ?? "";
  const userEmail = session?.user.email ?? "";
  const pageTitle =
    navSections
      .flatMap((s) => s.items)
      .find((item) => navItemActive(pathname, item.href))?.label ?? subtitle;

  const nav = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-white/10 px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-umbrella.png"
            alt=""
            width={40}
            height={40}
            className="h-8 w-8 rounded-md object-contain"
          />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold tracking-tight text-white">
              {title}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/65">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <p className="text-[10px] text-white/50">{roleLabel}</p>
          {isMock ? (
            <p className="inline-flex rounded bg-[#986A36]/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#E1D2A7]">
              Mode démo
            </p>
          ) : null}
        </div>
      </div>

      <nav className="portal-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2.5">
        {navSections.map((section) => (
          <div key={section.title} className="mb-3">
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E8C07A]">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = navItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
                      active
                        ? "bg-[#CB3228] text-white shadow-sm"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative z-10 shrink-0 space-y-2.5 border-t border-white/10 bg-[#1a1414] px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={userName} className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-[11px] text-white/50">{userEmail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
          <Link
            href={`${portalPrefix}/settings`}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white"
          >
            <Settings className="h-3.5 w-3.5" />
            Profil
          </Link>
          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
        {isMock ? (
          <button
            type="button"
            onClick={() => void onResetDemo()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser la démo
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="portal-sidebar sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col overflow-hidden lg:flex">
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
          <aside className="portal-sidebar relative flex h-full w-[260px] flex-col overflow-hidden shadow-soft">
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
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-cream bg-surface/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cream text-ink lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                {roleLabel}
              </p>
              <p className="truncate text-sm font-semibold text-ink">{pageTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <NotificationsMenu
                role={role}
                userId={session.user.id}
                portalPrefix={portalPrefix}
              />
            ) : null}
            <Link
              href={`${portalPrefix}/settings`}
              className="hidden items-center gap-2 rounded-xl border border-cream py-1 pl-1 pr-3 text-sm font-medium text-ink transition hover:border-brand md:inline-flex"
            >
              <Avatar name={userName} className="h-8 w-8" />
              <span className="max-w-[140px] truncate">{userName}</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
