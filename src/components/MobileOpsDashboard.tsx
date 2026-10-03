"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock,
  Coins,
  CreditCard,
  Package,
  RefreshCw,
  ScanLine,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

export type OpsKpi = {
  label: string;
  value: string;
  href: string;
  icon: "package" | "clock" | "truck" | "check" | "return" | "coins" | "alert";
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  accent: string;
  glow: string;
};

type DayPoint = {
  date: string;
  label: string;
  total: number;
};

type RecentParcel = {
  id: number;
  code: string | null;
  recipientName: string;
  city: string;
  status: string;
  price: string | number;
  createdAt: string;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPrice(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${new Intl.NumberFormat("fr-TN", {
    maximumFractionDigits: 3,
  }).format(n)} DT`;
}

function formatShortDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "short",
  });
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("fr-TN", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function statusVisual(status: string): {
  pill: string;
  box: string;
  label: string;
  Icon: LucideIcon;
} {
  if (status === "EN_ATTENTE" || status === "NON_SERIEUX")
    return {
      pill: "bg-[#FFAB00] text-[#0B0E14]",
      box: "bg-[#FFAB00] text-[#0B0E14]",
      label: "text-[#FFAB00]",
      Icon: Clock,
    };
  if (status === "LIVRES" || status === "LIVRES_PAYES")
    return {
      pill: "bg-[#00875A] text-white",
      box: "bg-[#00875A] text-white",
      label: "text-[#34d399]",
      Icon: CircleCheck,
    };
  if (status === "EN_COURS")
    return {
      pill: "bg-[#0065FF] text-white",
      box: "bg-[#0065FF] text-white",
      label: "text-[#60a5fa]",
      Icon: Truck,
    };
  if (status === "AU_DEPOT" || status === "A_VERIFIER" || status === "ECHANGES")
    return {
      pill: "bg-[#6554C0] text-white",
      box: "bg-[#6554C0] text-white",
      label: "text-[#a78bfa]",
      Icon: Package,
    };
  if (status === "A_ENLEVER" || status === "ENLEVES")
    return {
      pill: "bg-[#0065FF] text-white",
      box: "bg-[#0065FF] text-white",
      label: "text-[#60a5fa]",
      Icon: Truck,
    };
  if (status.startsWith("RETOUR"))
    return {
      pill: "bg-[#E11D48] text-white",
      box: "bg-[#E11D48] text-white",
      label: "text-[#fb7185]",
      Icon: X,
    };
  return {
    pill: "bg-zinc-600 text-white",
    box: "bg-zinc-600 text-white",
    label: "text-ops-ink/60",
    Icon: Package,
  };
}

const DELIVERED_TILES: { box: string; Icon: LucideIcon }[] = [
  { box: "bg-[#FFAB00]", Icon: Package },
  { box: "bg-[#00875A]", Icon: CircleCheck },
  { box: "bg-[#0065FF]", Icon: Truck },
  { box: "bg-[#6554C0]", Icon: Box },
];

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status as StatusKey];
  const { pill, Icon } = statusVisual(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold lg:gap-1 lg:px-2.5 lg:py-0.5 lg:text-[10px] ${pill}`}
    >
      <Icon className="h-3.5 w-3.5 lg:h-3 lg:w-3" strokeWidth={2.5} aria-hidden />
      {meta?.label ?? status}
    </span>
  );
}

const ICON_MAP: Record<OpsKpi["icon"], LucideIcon> = {
  package: Box,
  clock: Clock,
  truck: Truck,
  check: CircleCheck,
  return: RefreshCw,
  coins: Coins,
  alert: Clock,
};

const KPI_THEME: Record<
  OpsKpi["icon"],
  {
    border: string;
    glow: string;
    wash: string;
    badge: string;
    watermark: string;
  }
> = {
  package: {
    border: "border-[#E11D48]/40",
    glow: "shadow-[0_0_18px_rgba(225,29,72,0.22)]",
    wash: "bg-[#E11D48]/[0.12]",
    badge: "bg-[#E11D48]",
    watermark: "text-[#E11D48]",
  },
  clock: {
    border: "border-[#00875A]/45",
    glow: "shadow-[0_0_18px_rgba(0,135,90,0.2)]",
    wash: "bg-[#00875A]/[0.12]",
    badge: "bg-[#00875A]",
    watermark: "text-[#00875A]",
  },
  truck: {
    border: "border-[#0065FF]/45",
    glow: "shadow-[0_0_18px_rgba(0,101,255,0.2)]",
    wash: "bg-[#0065FF]/[0.12]",
    badge: "bg-[#0065FF]",
    watermark: "text-[#0065FF]",
  },
  check: {
    border: "border-[#6554C0]/45",
    glow: "shadow-[0_0_18px_rgba(101,84,192,0.22)]",
    wash: "bg-[#6554C0]/[0.12]",
    badge: "bg-[#6554C0]",
    watermark: "text-[#6554C0]",
  },
  return: {
    border: "border-[#FFAB00]/45",
    glow: "shadow-[0_0_18px_rgba(255,171,0,0.2)]",
    wash: "bg-[#FFAB00]/[0.12]",
    badge: "bg-[#FFAB00]",
    watermark: "text-[#FFAB00]",
  },
  coins: {
    border: "border-[#FFAB00]/40",
    glow: "shadow-[0_0_16px_rgba(255,171,0,0.16)]",
    wash: "bg-[#FFAB00]/[0.1]",
    badge: "bg-[#FFAB00]",
    watermark: "text-[#FFAB00]",
  },
  alert: {
    border: "border-[#E11D48]/50",
    glow: "shadow-[0_0_18px_rgba(225,29,72,0.28)]",
    wash: "bg-[#E11D48]/[0.14]",
    badge: "bg-[#E11D48]",
    watermark: "text-[#E11D48]",
  },
};

function OpsKpiCard({
  kpi,
  className,
}: {
  kpi: OpsKpi;
  className?: string;
}) {
  const Icon = ICON_MAP[kpi.icon];
  const theme = KPI_THEME[kpi.icon];
  const tone =
    kpi.deltaTone === "down"
      ? "text-rose-400"
      : kpi.deltaTone === "flat"
        ? "text-ops-ink/45"
        : "text-emerald-400";

  return (
    <Link
      href={kpi.href}
      className={cn(
        "relative min-h-[5.5rem] min-w-0 overflow-hidden rounded-2xl border bg-ops-surface px-3 py-3 transition hover:brightness-110 lg:min-h-0 lg:px-4 lg:py-4",
        theme.border,
        theme.glow,
        className,
      )}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${theme.wash}`}
        aria-hidden
      />
      <Icon
        className={`pointer-events-none absolute -bottom-2 -right-1 h-14 w-14 opacity-[0.12] lg:h-[4.75rem] lg:w-[4.75rem] ${theme.watermark}`}
        strokeWidth={1.15}
        aria-hidden
      />
      <div className="relative flex items-start gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-x-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white lg:col-start-1 lg:row-span-3 lg:h-11 lg:w-11 ${theme.badge}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1 lg:contents">
          <p className="truncate text-[14px] font-semibold leading-tight text-ops-ink lg:col-start-2 lg:row-start-1 lg:text-[13px] lg:font-medium">
            {kpi.label}
          </p>
          <p className="mt-1.5 font-display text-[1.75rem] font-extrabold leading-none tabular-nums tracking-tight text-ops-ink lg:col-start-2 lg:row-start-2 lg:mt-0 lg:text-[1.65rem]">
            {kpi.value}
          </p>
          {kpi.delta ? (
            <p className="mt-1.5 text-[12px] leading-tight lg:col-start-2 lg:row-start-3 lg:text-[11px]">
              <span className={`inline-flex items-center gap-0.5 font-semibold ${tone}`}>
                {kpi.deltaTone === "down" ? (
                  <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : kpi.deltaTone === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : null}
                {kpi.delta}
              </span>
              <span className="ml-1 font-normal text-ops-ink/45">
                vs hier
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type OpsDashboardProps = {
  basePath: string;
  firstName: string;
  subtitle: string;
  kpis: OpsKpi[];
  extraKpis?: OpsKpi[];
  revenue: number;
  inProgress: number;
  delivered: number;
  deliveryRate: number;
  lateCount: number;
  last7Days: DayPoint[];
  recent: RecentParcel[];
  returns: RecentParcel[];
  deliveredRecent: RecentParcel[];
  isSender: boolean;
  showNouveauCta?: boolean;
};

/** Dark ops board — same visual language on phone and desktop (mock-identical). */
export function MobileOpsDashboard(props: OpsDashboardProps) {
  return <OpsDashboardBoard {...props} />;
}

export function OpsDashboardBoard({
  basePath,
  firstName,
  subtitle,
  kpis,
  revenue,
  inProgress,
  delivered,
  deliveryRate,
  lateCount,
  last7Days,
  recent,
  returns,
  deliveredRecent,
  isSender,
  showNouveauCta = true,
}: OpsDashboardProps) {
  const now = new Date();
  const maxDay = Math.max(1, ...last7Days.map((d) => d.total));
  const analyticsHref = `${basePath}/analytics`;
  const nouveauHref = `${basePath}/nouveau`;
  const paymentsHref = `${basePath}/payments`;
  const parcelsHref = `${basePath}/parcels`;
  const retoursHref = isSender
    ? `${basePath}/retours`
    : `${basePath}/parcels?status=RETOUR_DEFINITIF`;
  const settingsHref = `${basePath}/settings`;
  const searchHref = `${basePath}/scanner`;
  const isLivreur = basePath.startsWith("/livreur");

  const shortcuts: {
    href: string;
    label: string;
    hint: string;
    tone: string;
    icon: LucideIcon;
    primary?: boolean;
  }[] = isLivreur
    ? [
        {
          href: parcelsHref,
          label: "Ma tournée",
          hint: "Colis à livrer aujourd’hui",
          tone: "bg-ops-accent",
          icon: Truck,
          primary: true,
        },
        {
          href: searchHref,
          label: "Scanner un colis",
          hint: "Code-barres ou QR",
          tone: "bg-violet-600",
          icon: ScanLine,
        },
        {
          href: parcelsHref,
          label: "Tous mes colis",
          hint: "Historique et suivi",
          tone: "bg-sky-600",
          icon: Package,
        },
        {
          href: settingsHref,
          label: "Mon profil",
          hint: "Compte et préférences",
          tone: "bg-zinc-600",
          icon: Settings,
        },
      ]
    : isSender
      ? [
          {
            href: nouveauHref,
            label: "Nouveau colis",
            hint: "Créer une livraison",
            tone: "bg-ops-accent",
            icon: Box,
            primary: true,
          },
          {
            href: parcelsHref,
            label: "Mes colis",
            hint: "Suivre et gérer",
            tone: "bg-sky-600",
            icon: Package,
          },
          {
            href: searchHref,
            label: "Scanner",
            hint: "Rechercher un colis",
            tone: "bg-violet-600",
            icon: ScanLine,
          },
          {
            href: paymentsHref,
            label: "Paiements",
            hint: "Soldes et virements",
            tone: "bg-emerald-600",
            icon: CreditCard,
          },
          {
            href: retoursHref,
            label: "Retours",
            hint: "Colis à récupérer",
            tone: "bg-amber-500",
            icon: RefreshCw,
          },
          {
            href: `${basePath}/adresses`,
            label: "Clients",
            hint: "Carnet d’adresses",
            tone: "bg-[#6554C0]",
            icon: Users,
          },
        ]
      : [
          {
            href: nouveauHref,
            label: "Nouveau colis",
            hint: "Créer une livraison",
            tone: "bg-ops-accent",
            icon: Box,
            primary: true,
          },
          {
            href: parcelsHref,
            label: "Tous les colis",
            hint: "Liste et filtres",
            tone: "bg-sky-600",
            icon: Package,
          },
          {
            href: searchHref,
            label: "Scanner",
            hint: "Code-barres ou QR",
            tone: "bg-violet-600",
            icon: ScanLine,
          },
          {
            href: `${basePath}/dispatch`,
            label: "Livraisons",
            hint: "Dispatch et tournées",
            tone: "bg-[#0065FF]",
            icon: Truck,
          },
          {
            href: paymentsHref,
            label: "Paiements",
            hint: "Encaissements",
            tone: "bg-emerald-600",
            icon: CreditCard,
          },
          {
            href: retoursHref,
            label: "Retours",
            hint: "À traiter",
            tone: "bg-amber-500",
            icon: RefreshCw,
          },
        ];

  const primaryHref = isLivreur
    ? `${basePath}/parcels`
    : showNouveauCta
      ? nouveauHref
      : parcelsHref;
  const primaryLabel = isLivreur ? "Mes colis du jour" : "Nouveau colis";
  const primaryHint = isLivreur
    ? "Voir les colis à livrer"
    : "Ajouter un colis en un clic";

  const rowKpis: OpsKpi[] = [
    ...kpis,
    {
      label: "Colis en retard",
      value: String(lateCount),
      href: `${parcelsHref}?status=EN_COURS`,
      icon: "alert",
      accent: "bg-[#3a1a1f] text-[#fb7185]",
      glow: "shadow-[0_0_32px_rgba(225,29,72,0.14)]",
      delta: lateCount > 0 ? `+${lateCount}` : "=",
      deltaTone: lateCount > 0 ? "up" : "flat",
    },
  ];

  return (
    <div className="ops-board -mx-3 -mt-2 space-y-3 bg-ops-page px-3 pb-3 pt-1 text-ops-ink md:-mx-4 md:px-4 lg:-mx-5 lg:space-y-3 lg:px-5 lg:pb-2 lg:pt-0">
      <section className="relative overflow-hidden rounded-2xl border border-ops-card bg-ops-surface">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src="/assets/hero-bg.jpg"
            alt=""
            fill
            priority
            className="object-cover object-[70%_center] opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ops-page via-ops-page/85 to-ops-page/30" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between lg:px-6 lg:py-5">
          <div className="min-w-0">
            <h1 className="font-display text-[1.5rem] font-extrabold tracking-tight lg:text-[1.75rem]">
              Bonjour{firstName ? ` ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-[15px] text-ops-ink/70 lg:text-sm">{subtitle}</p>
            <p className="mt-2 text-[13px] capitalize text-ops-ink/50">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden />
                {formatGreetingDate(now)}
              </span>
              <span className="mx-2 text-ops-ink/25">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                {formatGreetingTime(now)}
              </span>
            </p>
          </div>
          <Link
            href={primaryHref}
            className="hidden min-h-12 items-center justify-center gap-2 rounded-full bg-ops-accent px-5 py-3 text-[15px] font-semibold text-white shadow-[0_0_20px_rgba(225,29,72,0.35)] transition hover:bg-ops-accent-soft lg:inline-flex"
          >
            {isLivreur ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
            {primaryLabel}
          </Link>
        </div>
      </section>

      {showNouveauCta ? (
        <Link
          href={primaryHref}
          className="flex min-h-14 items-center gap-3 rounded-2xl bg-ops-accent px-4 py-3.5 text-white shadow-[0_10px_28px_rgba(225,29,72,0.32)] transition hover:bg-ops-accent-soft lg:hidden"
        >
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            {isLivreur ? (
              <Truck className="h-6 w-6" strokeWidth={2.25} />
            ) : (
              <Package className="h-6 w-6" strokeWidth={2.25} />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-bold leading-tight">
              {primaryLabel}
            </span>
            <span className="mt-0.5 block text-[13px] text-white/80">
              {primaryHint}
            </span>
          </span>
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      ) : null}

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6">
        {rowKpis.map((kpi) => (
          <OpsKpiCard key={kpi.label} kpi={kpi} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid shrink-0 grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
            <section className="flex h-full flex-col rounded-2xl border border-ops-card bg-ops-surface p-3.5 shadow-ops lg:col-span-8">
              <div className="flex shrink-0 items-center justify-between gap-2">
                <h2 className="text-[17px] font-semibold text-ops-ink lg:text-[15px]">
                  Évolution des livraisons
                  <span className="mt-0.5 block text-[13px] font-medium text-ops-ink/45 lg:ml-1 lg:mt-0 lg:inline">
                    (7 jours)
                  </span>
                </h2>
                <Link
                  href={analyticsHref}
                  className="shrink-0 text-[14px] font-semibold text-ops-accent lg:text-[12px]"
                >
                  Détail →
                </Link>
              </div>
              <div className="mt-2.5 flex min-h-[11rem] flex-1 gap-2 lg:min-h-0">
                <div className="flex w-7 shrink-0 flex-col" aria-hidden>
                  <div className="h-4 shrink-0" />
                  <div className="relative min-h-[7rem] flex-1 border-r border-ops-ink/20">
                    {Array.from({ length: maxDay + 1 }, (_, i) => maxDay - i).map(
                      (tick) => (
                        <span
                          key={tick}
                          className="absolute right-1.5 -translate-y-1/2 text-[10px] leading-none tabular-nums text-ops-ink/40"
                          style={{
                            top:
                              maxDay === 0
                                ? "100%"
                                : `${((maxDay - tick) / maxDay) * 100}%`,
                          }}
                        >
                          {tick}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="h-4 shrink-0" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex min-h-[7rem] flex-1 gap-1 border-b border-ops-ink/15">
                    {last7Days.map((d) => {
                      const pct = maxDay > 0 ? (d.total / maxDay) * 100 : 0;
                      return (
                        <div
                          key={d.date}
                          className="relative flex min-h-0 min-w-0 flex-1 items-end justify-center"
                        >
                          {d.total > 0 ? (
                            <div
                              className="relative w-[58%] rounded-t-md bg-gradient-to-t from-[#991211] to-[#E11D48]"
                              style={{ height: `${pct}%` }}
                            >
                              <span className="absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 text-[11px] font-semibold leading-none tabular-nums text-ops-ink">
                                {d.total}
                              </span>
                            </div>
                          ) : (
                            <span className="absolute bottom-0 left-1/2 mb-0.5 -translate-x-1/2 text-[11px] font-semibold leading-none tabular-nums text-ops-ink">
                              0
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 flex shrink-0 gap-1">
                    {last7Days.map((d) => (
                      <span
                        key={`${d.date}-label`}
                        className="min-w-0 flex-1 text-center text-[10px] leading-none text-ops-ink/40"
                      >
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col rounded-2xl border border-ops-card bg-ops-surface p-3.5 shadow-ops lg:col-span-4">
              <h2 className="shrink-0 text-[17px] font-semibold text-ops-ink lg:text-[15px]">
                Chiffres clés
              </h2>
              <ul className="mt-2.5 flex flex-1 flex-col justify-between gap-2.5">
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Box className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-extrabold tabular-nums text-ops-ink">
                      {formatMoney(revenue)}
                    </span>
                    <span className="text-[11px] text-ops-ink/45">
                      Volume des colis
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white">
                    <Truck className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-extrabold tabular-nums text-ops-ink">
                      {inProgress}
                    </span>
                    <span className="text-[11px] text-ops-ink/45">En cours</span>
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <CircleCheck className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-base font-extrabold tabular-nums text-ops-ink">
                      {delivered}
                    </span>
                    <span className="text-[11px] text-ops-ink/45">Livrés</span>
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center">
                    <svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        className="text-ops-ink/10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        stroke="#E11D48"
                        strokeWidth="3"
                        strokeDasharray={`${deliveryRate * 0.94} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold tabular-nums text-ops-ink">
                      {deliveryRate}%
                    </span>
                  </span>
                  <span className="text-[11px] text-ops-ink/45">
                    Livrés à temps
                  </span>
                </li>
              </ul>
            </section>
          </div>

          <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-ops-card bg-ops-surface p-4 shadow-ops">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[18px] font-semibold text-ops-ink lg:text-[16px]">
                Derniers colis
              </h2>
              <Link
                href={parcelsHref}
                className="text-[14px] font-semibold text-ops-accent"
              >
                Voir tout →
              </Link>
            </div>

            <div className="mt-3 hidden flex-1 lg:block">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-ops-card text-[12px] uppercase tracking-[0.08em] text-ops-ink/40">
                    <th className="pb-2.5 pr-3 font-semibold">N° de colis</th>
                    <th className="pb-2.5 pr-3 font-semibold">Client</th>
                    <th className="pb-2.5 pr-3 font-semibold">Ville</th>
                    <th className="pb-2.5 pr-3 font-semibold">Statut</th>
                    <th className="pb-2.5 pr-3 font-semibold">Montant</th>
                    <th className="pb-2.5 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-ink/[0.08]">
                  {recent.slice(0, 12).map((p) => (
                    <tr key={p.id} className="hover:bg-ops-ink/[0.03]">
                      <td className="py-3.5 pr-3">
                        <Link
                          href={`${basePath}/parcels/${p.id}`}
                          className="font-mono text-[14px] font-bold text-ops-accent"
                        >
                          {p.code ?? `#${p.id}`}
                        </Link>
                      </td>
                      <td className="py-3.5 pr-3 text-[14px] font-medium text-ops-ink/90">
                        {p.recipientName}
                      </td>
                      <td className="py-3.5 pr-3 text-[14px] text-ops-ink/55">
                        {p.city}
                      </td>
                      <td className="py-3.5 pr-3">
                        <StatusPill status={p.status} />
                      </td>
                      <td className="py-3.5 pr-3 text-[14px] font-bold tabular-nums">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3.5 text-[13px] text-ops-ink/45">
                        <span className="inline-flex items-center gap-1">
                          {formatShortDate(p.createdAt)}
                          <ChevronRight
                            className="h-4 w-4 text-ops-ink/25"
                            aria-hidden
                          />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-2 divide-y divide-ops-ink/[0.08] lg:hidden">
              {recent.length === 0 ? (
                <li className="py-8 text-center text-base text-ops-ink/40">
                  Aucun colis récent
                </li>
              ) : (
                recent.slice(0, 12).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${basePath}/parcels/${p.id}`}
                      className="flex min-h-[4.75rem] items-center justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[15px] font-bold text-ops-accent">
                          {p.code ?? `#${p.id}`}
                        </p>
                        <p className="mt-0.5 truncate text-[15px] font-semibold">
                          {p.recipientName}
                        </p>
                        <p className="mt-0.5 text-[13px] text-ops-ink/45">
                          {p.city} · {formatShortDate(p.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-right">
                        <div>
                          <StatusPill status={p.status} />
                          <p className="mt-1.5 text-[15px] font-extrabold tabular-nums">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                        <ChevronRight
                          className="h-5 w-5 text-ops-ink/30"
                          aria-hidden
                        />
                      </div>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="shrink-0 rounded-2xl border border-ops-card bg-ops-surface p-3.5 shadow-ops">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold text-ops-ink lg:text-[15px]">
                Derniers retours
              </h2>
              <Link
                href={retoursHref}
                className="text-[14px] font-semibold text-ops-accent lg:text-[12px]"
              >
                Voir tout →
              </Link>
            </div>
            {returns.length === 0 ? (
              <p className="mt-2 text-center text-[14px] text-ops-ink/40">
                Aucun retour
              </p>
            ) : (
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {returns.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${basePath}/parcels/${p.id}`}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-ops-card px-3 py-2.5 transition hover:bg-ops-ink/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[13px] font-bold text-ops-accent">
                          {p.code ?? `#${p.id}`}
                        </p>
                        <p className="truncate text-[12px] text-ops-ink/45">
                          {p.city} · {formatShortDate(p.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#FFAB00] px-2.5 py-1 text-[11px] font-bold text-[#0B0E14]">
                        {STATUS_META[p.status as StatusKey]?.label ?? p.status}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-3">
          <section className="rounded-2xl border border-ops-card bg-ops-surface p-3.5 shadow-ops">
            <h2 className="text-[17px] font-semibold text-ops-ink lg:text-[15px]">
              Actions rapides
            </h2>
            <ul className="mt-2.5 space-y-1.5">
              {shortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.label}>
                    <Link
                      href={s.href}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-2.5 py-2 transition",
                        s.primary
                          ? "bg-ops-accent text-white shadow-[0_8px_20px_rgba(225,29,72,0.28)] hover:bg-ops-accent-soft"
                          : "border border-ops-card bg-ops-ink/[0.03] hover:bg-ops-ink/[0.07]",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
                          s.primary ? "bg-white/20" : s.tone,
                        )}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-[14px] font-semibold leading-tight",
                            s.primary ? "text-white" : "text-ops-ink",
                          )}
                        >
                          {s.label}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-[11px] leading-tight",
                            s.primary ? "text-white/75" : "text-ops-ink/45",
                          )}
                        >
                          {s.hint}
                        </span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0",
                          s.primary ? "text-white/70" : "text-ops-ink/30",
                        )}
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!isLivreur ? (
              <Link
                href={settingsHref}
                className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-xl border border-ops-card bg-ops-ink/[0.04] px-3 py-2 text-[13px] font-semibold text-ops-ink/80 transition hover:bg-ops-ink/[0.08]"
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-2xl border border-ops-card bg-ops-surface shadow-ops">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="min-w-0">
                <h2 className="font-display text-[14px] font-bold leading-snug text-ops-ink">
                  Livraison plus rapide, plus proche de vos clients
                </h2>
                <Link
                  href="/tarifs"
                  className="mt-2 inline-flex rounded-full bg-ops-accent px-3 py-1.5 text-[11px] font-semibold text-white"
                >
                  Découvrir nos offres
                </Link>
              </div>
              <div className="relative h-12 w-24 shrink-0">
                <Image
                  src="/assets/cargo-van-clean.png"
                  alt=""
                  fill
                  className="object-contain object-right"
                  sizes="96px"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-ops-card bg-ops-surface p-3.5 shadow-ops">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold text-ops-ink lg:text-[15px]">
                Activité récente
              </h2>
              <Link
                href={parcelsHref}
                className="text-[14px] font-semibold text-ops-accent lg:text-[12px]"
              >
                Voir tout →
              </Link>
            </div>
            <ul className="mt-2 space-y-0.5">
              {recent.length === 0 ? (
                <li className="py-4 text-center text-[14px] text-ops-ink/40">
                  Aucune activité
                </li>
              ) : (
                recent.slice(0, 4).map((p) => {
                  const meta = STATUS_META[p.status as StatusKey];
                  const { box, label, Icon } = statusVisual(p.status);
                  return (
                    <li key={p.id}>
                      <Link
                        href={`${basePath}/parcels/${p.id}`}
                        className="flex min-h-11 items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-ops-ink/[0.05]"
                      >
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${box}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-ops-ink">
                            Colis #{p.code ?? p.id}
                          </span>
                          <span
                            className={`block truncate text-[11px] font-medium ${label}`}
                          >
                            {meta?.label ?? p.status}
                          </span>
                        </span>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-ops-ink/30"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="flex flex-1 flex-col rounded-2xl border border-ops-card bg-ops-surface p-3.5 shadow-ops">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold text-ops-ink lg:text-[15px]">
                Derniers colis livrés
              </h2>
              <Link
                href={`${parcelsHref}?status=LIVRES`}
                className="text-[14px] font-semibold text-ops-accent lg:text-[12px]"
              >
                Voir tout →
              </Link>
            </div>
            <ul className="mt-2 flex flex-1 flex-col justify-start gap-0.5">
              {deliveredRecent.length === 0 ? (
                <li className="py-4 text-center text-[14px] text-ops-ink/40">
                  Aucune livraison récente
                </li>
              ) : (
                deliveredRecent.slice(0, 5).map((p, index) => {
                  const tile = DELIVERED_TILES[index % DELIVERED_TILES.length];
                  const TileIcon = tile.Icon;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`${basePath}/parcels/${p.id}`}
                        className="flex min-h-11 items-center gap-2.5 rounded-xl px-1 py-1.5 transition hover:bg-ops-ink/[0.05]"
                      >
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${tile.box}`}
                        >
                          <TileIcon className="h-4 w-4" strokeWidth={2.25} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-[13px] font-bold text-ops-ink">
                            {p.code ?? `#${p.id}`}
                          </p>
                          <p className="truncate text-[11px] text-ops-ink/45">
                            {p.city} · {formatPrice(p.price)}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-ops-ink/40">
                          {formatTime(p.createdAt)}
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </aside>
      </div>

      <footer className="flex flex-col gap-2 border-t border-ops-card pt-3 text-[12px] text-ops-ink/40 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Umbrella Express © {now.getFullYear()}. Tous droits réservés.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Système en ligne
          <ShieldCheck className="h-3.5 w-3.5 text-ops-ink/35" aria-hidden />
        </span>
      </footer>
    </div>
  );
}
