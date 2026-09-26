"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ArrowUpRight, Wallet } from "lucide-react";
import { StatusBoard } from "@/components/StatusBoard";
import { apiFetch, type StatusCard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

gsap.registerPlugin(useGSAP);

type AnalyticsPayload = {
  kpis: {
    total: number;
    external: number;
    internal: number;
    delivered: number;
    inProgress: number;
    returns: number;
    awaiting: number;
    exchanges?: number;
    revenue: number;
    deliveryRate: number;
    returnRate: number;
  };
  soldes?: {
    disponible: number;
    enDemande: number;
    aVerser: number;
    verse: number;
  };
  last7Days: Array<{
    date: string;
    label: string;
    total: number;
    delivered: number;
    external: number;
    internal: number;
  }>;
};

type RecentParcel = {
  id: number;
  code: string | null;
  recipientName: string;
  phone?: string;
  city: string;
  status: string;
  mode: "EXTERNAL" | "INTERNAL";
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

export function AdminNavexDashboard({
  basePath = "/admin",
  variant = "ops",
}: {
  basePath?: string;
  variant?: "ops" | "sender";
}) {
  const { session } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<StatusCard[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [recent, setRecent] = useState<RecentParcel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isSender = variant === "sender";
  const analyticsHref = `${basePath}/analytics`;

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    Promise.all([
      apiFetch<StatusCard[]>("/dashboard/status-counts", {
        token: session.accessToken,
      }),
      apiFetch<AnalyticsPayload>("/dashboard/analytics", {
        token: session.accessToken,
      }),
      apiFetch<RecentParcel[]>("/parcels", { token: session.accessToken }),
    ])
      .then(([counts, stats, parcels]) => {
        setItems(counts);
        setAnalytics(stats);
        setRecent(parcels.slice(0, 6));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const maxDay = useMemo(() => {
    if (!analytics?.last7Days.length) return 1;
    return Math.max(1, ...analytics.last7Days.map((d) => d.total));
  }, [analytics]);

  const weekTotal = useMemo(
    () => analytics?.last7Days.reduce((s, d) => s + d.total, 0) ?? 0,
    [analytics],
  );

  useGSAP(
    () => {
      if (loading) return;
      gsap.fromTo(
        ".dash-reveal",
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          duration: 0.32,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    },
    { scope: root, dependencies: [loading, analytics] },
  );

  const kpis = analytics?.kpis;
  const soldes = analytics?.soldes;

  const topCounters = kpis
    ? [
        {
          label: isSender ? "Mes colis" : "Total",
          value: String(kpis.total),
          href: `${basePath}/parcels`,
        },
        {
          label: "En attente",
          value: String(kpis.awaiting),
          href: `${basePath}/parcels?status=EN_ATTENTE`,
        },
        {
          label: "En cours",
          value: String(kpis.inProgress),
          href: `${basePath}/parcels?status=EN_COURS`,
        },
        {
          label: "Livrés",
          value: String(kpis.delivered),
          sub: `${kpis.deliveryRate}%`,
          href: `${basePath}/parcels?status=LIVRES`,
        },
        {
          label: "Retours",
          value: String(kpis.returns),
          href: isSender
            ? `${basePath}/retours`
            : `${basePath}/parcels?status=RETOUR_DEFINITIF`,
        },
        {
          label: isSender ? "Volume COD" : "CA",
          value: formatMoney(kpis.revenue).replace(/\s/g, "\u00a0"),
          href: analyticsHref,
        },
      ]
    : [];

  return (
    <div ref={root} className="space-y-7">
      <header className="dash-reveal flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Umbrella Express
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            {isSender ? "Tableau de bord" : "Dashboard"}
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Bonjour {session?.user.name} — opérations du jour
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch lg:w-auto lg:flex-col lg:items-end">
          {!loading && soldes ? (
            <Link
              href={`${basePath}/payments`}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-cream bg-surface px-3.5 py-2.5 transition hover:border-brand/40 sm:max-w-sm lg:max-w-none lg:flex-none"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Wallet className="h-4 w-4" aria-hidden />
              </span>
              <span className="grid min-w-0 flex-1 grid-cols-2 gap-3">
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Solde
                  </span>
                  <span className="mt-0.5 block font-display text-lg font-extrabold tabular-nums leading-none text-ink">
                    {formatMoney(soldes.disponible)}
                  </span>
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    En demande
                  </span>
                  <span className="mt-0.5 block font-display text-lg font-extrabold tabular-nums leading-none text-ink">
                    {formatMoney(soldes.enDemande)}
                  </span>
                </span>
              </span>
            </Link>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 lg:justify-end">
            <Link
              href={analyticsHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-cream bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40"
            >
              Analytics
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            {isSender ? (
              <Link
                href={`${basePath}/payments`}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40"
              >
                Paiements
              </Link>
            ) : (
              <Link
                href={`${basePath}/dispatch`}
                className="rounded-full border border-cream bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand/40"
              >
                Dispatch
              </Link>
            )}
            <Link
              href={`${basePath}/nouveau`}
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-soft"
            >
              Nouveau colis
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="h-24 animate-pulse rounded-2xl border border-cream bg-surface" />
      ) : null}

      {!loading && topCounters.length > 0 ? (
        <section className="dash-reveal rounded-2xl border border-cream bg-surface">
          <div className="grid grid-cols-2 divide-cream sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
            {topCounters.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group border-b border-cream px-3 py-4 transition hover:bg-brand/[0.03] sm:px-4 sm:py-5 lg:border-b-0"
              >
                <p className="font-display text-2xl font-extrabold tabular-nums tracking-tight text-ink sm:text-3xl md:text-4xl">
                  {item.value}
                  {item.sub ? (
                    <span className="ml-1.5 align-middle text-sm font-bold text-brand">
                      {item.sub}
                    </span>
                  ) : null}
                </p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted group-hover:text-brand">
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <section className="dash-reveal space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Statuts
          </h2>
          <StatusBoard items={items} basePath={basePath} />
        </section>
      ) : null}

      {!loading && analytics ? (
        <Link
          href={analyticsHref}
          className="dash-reveal block space-y-4 rounded-2xl border border-cream bg-surface p-5 transition hover:border-brand/30 hover:shadow-soft"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold text-ink">
                  Volume 7 jours
                </h2>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">
                {weekTotal} création(s) · ouvrir analytics
              </p>
            </div>
          </div>
          <div className="flex h-36 items-end gap-2">
            {analytics.last7Days.map((d) => {
              const h = Math.max(d.total ? 12 : 0, (d.total / maxDay) * 100);
              return (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <p className="text-[11px] font-bold tabular-nums text-ink">
                    {d.total || "·"}
                  </p>
                  <div className="flex h-24 w-full items-end justify-center">
                    <div
                      className="w-[52%] rounded-t bg-brand"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-ink-muted">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Link>
      ) : null}

      {!loading && recent.length > 0 ? (
        <section className="dash-reveal space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">
              Derniers colis
            </h2>
            <Link
              href={`${basePath}/parcels`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cream bg-surface">
            <div className="hidden grid-cols-[1.2fr_1.4fr_1fr_auto_auto] gap-3 border-b border-cream bg-cream-soft/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted md:grid">
              <span>Code</span>
              <span>Destinataire</span>
              <span>Statut</span>
              <span>Date</span>
              <span className="text-right">COD</span>
            </div>
            <ul className="divide-y divide-cream">
              {recent.map((p) => {
                const meta = STATUS_META[p.status as StatusKey];
                return (
                  <li key={p.id}>
                    <Link
                      href={`${basePath}/parcels/${p.id}`}
                      className="grid grid-cols-1 gap-2 px-4 py-3.5 transition hover:bg-brand/[0.03] md:grid-cols-[1.2fr_1.4fr_1fr_auto_auto] md:items-center md:gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold text-brand">
                          {p.code ?? `#${p.id}`}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted md:hidden">
                          {p.recipientName} · {p.city}
                        </p>
                      </div>
                      <div className="hidden min-w-0 md:block">
                        <p className="truncate font-semibold text-ink">
                          {p.recipientName}
                        </p>
                        <p className="truncate text-xs text-ink-muted">
                          {p.city}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-cream px-2.5 py-1 text-[11px] font-bold text-ink">
                          <span aria-hidden>{meta?.emoji ?? "📋"}</span>
                          {meta?.label ?? p.status}
                        </span>
                      </div>
                      <span className="hidden text-sm text-ink-muted md:block">
                        {formatShortDate(p.createdAt)}
                      </span>
                      <span className="text-right text-sm font-extrabold tabular-nums text-ink">
                        {formatPrice(p.price)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
