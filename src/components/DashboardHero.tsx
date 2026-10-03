"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";
import { CalendarDays, Clock3, Coins } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { HeroVanScene } from "@/components/landing/HeroVanScene";

function formatSolde(n: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatGreetingDate(d: Date) {
  return d.toLocaleDateString("fr-TN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatGreetingTime(d: Date) {
  return d.toLocaleTimeString("fr-TN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type DashboardHeroAction = {
  href: string;
  label: string;
  primary?: boolean;
  icon?: ReactNode;
};

type DashboardHeroProps = {
  subtitle: string;
  actions?: DashboardHeroAction[];
  footer?: ReactNode;
  className?: string;
  solde?: number | null;
};

/** Shared portal hero: animated landing van + optional solde. */
export function DashboardHero({
  subtitle,
  actions = [],
  footer,
  className,
  solde = null,
}: DashboardHeroProps) {
  const { session } = useAuth();
  const now = new Date();
  const firstName = session?.user.name?.split(/\s+/)[0] ?? "";

  return (
    <header className={className}>
      <section className="relative min-h-[188px] overflow-hidden rounded-2xl border border-ops-card bg-ops-surface text-ops-ink sm:min-h-[200px]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-ops-page via-ops-surface to-[#2a1518]" />
          <HeroVanScene variant="portal" />
          <div className="absolute inset-0 bg-gradient-to-r from-ops-page from-[42%] via-ops-page/95 via-[68%] to-ops-page/15 sm:from-[28%] sm:via-ops-page/88 sm:via-[55%] sm:to-ops-page/10" />
        </div>

        <div className="relative z-10 flex min-h-[188px] flex-col gap-5 px-5 py-6 sm:min-h-[200px] sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-7">
          <div className="relative z-10 mx-auto max-w-[min(100%,18.5rem)] text-center sm:max-w-xl lg:mx-0 lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ops-ink/50">
              Umbrella Express
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ops-ink drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] sm:text-4xl">
              Bonjour{firstName ? ` ${firstName}` : ""}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ops-ink/85 sm:text-[15px]">
              {subtitle}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-ops-ink/65 lg:justify-start">
              {solde != null ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Coins className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Solde
                  <span className="font-display text-sm font-extrabold tabular-nums text-emerald-950 dark:text-white">
                    {formatSolde(solde)}
                  </span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 capitalize">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {formatGreetingDate(now)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {formatGreetingTime(now)}
              </span>
            </div>
          </div>

          {actions.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.primary
                      ? "inline-flex items-center gap-1.5 rounded-full bg-ops-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-ops-accent-soft"
                      : "inline-flex items-center gap-1.5 rounded-full border border-ops-card bg-ops-ink/[0.06] px-4 py-2 text-sm font-semibold text-ops-ink transition hover:bg-ops-ink/[0.1]"
                  }
                >
                  {action.label}
                  {action.icon}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </header>
  );
}

export function DashboardPromo({ className }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-ops-card bg-ops-surface text-ops-ink ${className ?? ""}`}
    >
      <div className="relative flex flex-col items-center gap-5 px-5 py-6 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8 lg:py-7 lg:text-left">
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-xl font-bold tracking-tight text-ops-ink sm:text-2xl">
            Livraison plus rapide, plus proche de vos clients
          </h2>
        </div>
        <div className="relative z-10 hidden h-28 w-48 shrink-0 lg:block lg:h-32 lg:w-56">
          <Image
            src="/assets/cargo-van-clean.png"
            alt=""
            fill
            className="object-contain object-right"
            sizes="224px"
          />
        </div>
      </div>
    </section>
  );
}
