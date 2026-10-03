"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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
};

/** Shared portal hero: van on desktop only, centered copy on mobile. */
export function DashboardHero({
  subtitle,
  actions = [],
  footer,
  className,
}: DashboardHeroProps) {
  const { session } = useAuth();
  const now = new Date();
  const firstName = session?.user.name?.split(/\s+/)[0] ?? "";

  return (
    <header className={className}>
      <section className="relative overflow-hidden rounded-2xl border border-ops-card bg-ops-surface text-ops-ink">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ops-accent/30 via-ops-surface to-ops-page lg:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          aria-hidden
        >
          <Image
            src="/assets/hero-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover object-[70%_center]"
            sizes="(min-width: 1024px) 960px, 0px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ops-page via-ops-page/88 to-ops-page/35" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 px-5 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-7">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ops-ink/50">
              Umbrella Express
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ops-ink sm:text-4xl">
              Bonjour{firstName ? ` ${firstName}` : ""} 👋
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ops-ink/65 sm:text-[15px]">
              {subtitle}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-ops-ink/50 lg:justify-start">
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

export function DashboardPromo({
  href = "/tarifs",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-ops-card bg-ops-surface text-ops-ink ${className ?? ""}`}
    >
      <div className="relative flex flex-col items-center gap-5 px-5 py-6 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8 lg:py-7 lg:text-left">
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-xl font-bold tracking-tight text-ops-ink sm:text-2xl">
            Livraison plus rapide, plus proche de vos clients
          </h2>
          <Link
            href={href}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-ops-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ops-accent-soft"
          >
            Découvrir nos offres
          </Link>
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
