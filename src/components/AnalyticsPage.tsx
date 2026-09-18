"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, Wallet } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { canSeeDeliveryMode } from "@/lib/roles";

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
    encaisse: number;
    retoursMontant: number;
    retoursFrais: number;
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

function formatMoney(n: number) {
  return new Intl.NumberFormat("fr-TN", {
    style: "currency",
    currency: "TND",
    maximumFractionDigits: 0,
  }).format(n);
}

export function AnalyticsPage({
  basePath = "/admin",
  variant = "ops",
}: {
  basePath?: string;
  variant?: "ops" | "sender";
}) {
  const { session } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isSender = variant === "sender";
  const showModes = canSeeDeliveryMode(session?.user.role);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    apiFetch<AnalyticsPayload>("/dashboard/analytics", {
      token: session.accessToken,
    })
      .then(setAnalytics)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const maxDay = useMemo(() => {
    if (!analytics?.last7Days.length) return 1;
    if (showModes) {
      return Math.max(
        1,
        ...analytics.last7Days.map((d) =>
          Math.max(d.external, d.internal, d.total, d.delivered),
        ),
      );
    }
    return Math.max(
      1,
      ...analytics.last7Days.map((d) => Math.max(d.total, d.delivered)),
    );
  }, [analytics, showModes]);

  const weekTotal = useMemo(
    () => analytics?.last7Days.reduce((s, d) => s + d.total, 0) ?? 0,
    [analytics],
  );

  const weekDelivered = useMemo(
    () => analytics?.last7Days.reduce((s, d) => s + d.delivered, 0) ?? 0,
    [analytics],
  );

  useGSAP(
    () => {
      if (loading) return;
      gsap.fromTo(
        ".an-reveal",
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.3,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    },
    { scope: root, dependencies: [loading, analytics] },
  );

  const kpis = analytics?.kpis;
  const soldes = analytics?.soldes;

  return (
    <div ref={root} className="space-y-7">
      <header className="an-reveal flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={basePath}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Analytics
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Performance, soldes et volume — pas la gestion opérationnelle
          </p>
        </div>
        {isSender ? (
          <Link
            href={`${basePath}/payments`}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            <Wallet className="h-4 w-4" />
            Demander un versement
          </Link>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-medium text-brand">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-cream-soft" />
          ))}
        </div>
      ) : null}

      {!loading && kpis ? (
        <section className="an-reveal grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: "Taux de livraison",
              value: `${kpis.deliveryRate}%`,
              hint: `${kpis.delivered} / ${kpis.total} colis`,
            },
            {
              label: "Taux de retour",
              value: `${kpis.returnRate}%`,
              hint: `${kpis.returns} retours`,
            },
            {
              label: isSender ? "Volume COD" : "Chiffre d'affaires",
              value: formatMoney(kpis.revenue),
              hint: `${kpis.total} colis`,
            },
            {
              label: "Échanges",
              value: String(kpis.exchanges ?? 0),
              hint: "Sur la période",
            },
          ].map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-cream bg-surface p-5"
            >
              <p className="text-sm font-semibold text-ink-muted">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-extrabold tabular-nums text-ink">
                {card.value}
              </p>
              <p className="mt-2 text-sm text-ink-muted">{card.hint}</p>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && soldes ? (
        <section className="an-reveal space-y-3">
          <h2 className="font-display text-xl font-bold text-ink">
            {isSender ? "Soldes & versements" : "Soldes COD réseau"}
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Disponible",
                value: formatMoney(soldes.disponible),
                accent: true,
              },
              {
                label: "En demande",
                value: formatMoney(soldes.enDemande),
              },
              {
                label: "À verser",
                value: formatMoney(soldes.aVerser),
              },
              {
                label: "Déjà versé",
                value: formatMoney(soldes.verse),
              },
            ].map((card) => (
              <article
                key={card.label}
                className={`rounded-2xl border p-5 ${
                  card.accent
                    ? "border-brand/30 bg-brand/[0.06]"
                    : "border-cream bg-surface"
                }`}
              >
                <p className="text-sm font-semibold text-ink-muted">
                  {card.label}
                </p>
                <p
                  className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${
                    card.accent ? "text-brand" : "text-ink"
                  }`}
                >
                  {card.value}
                </p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-cream bg-surface px-5 py-4 text-sm">
            <p>
              <span className="font-semibold text-ink-muted">Encaissé · </span>
              <span className="font-bold tabular-nums text-ink">
                {formatMoney(soldes.encaisse)}
              </span>
            </p>
            <p>
              <span className="font-semibold text-ink-muted">
                Montant retours ·{" "}
              </span>
              <span className="font-bold tabular-nums text-ink">
                {formatMoney(soldes.retoursMontant)}
              </span>
            </p>
            <p>
              <span className="font-semibold text-ink-muted">
                Frais retours ·{" "}
              </span>
              <span className="font-bold tabular-nums text-brand">
                {formatMoney(soldes.retoursFrais)}
              </span>
            </p>
          </div>
        </section>
      ) : null}

      {!loading && analytics ? (
        <section className="an-reveal space-y-4 rounded-2xl border border-cream bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Volume 7 jours
              </h2>
              <p className="mt-0.5 text-sm text-ink-muted">
                {weekTotal} créations · {weekDelivered} livrés
                {showModes ? " · External vs Internal" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink">
              {showModes ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-chart-ext" />{" "}
                    EXTERNAL
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-chart-int" />{" "}
                    INTERNAL
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Créations
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm bg-ink/40" /> Livrés
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex h-52 items-end gap-2 sm:h-60">
            {analytics.last7Days.map((d) => {
              if (!showModes) {
                const createH = Math.max(
                  d.total ? 10 : 0,
                  (d.total / maxDay) * 100,
                );
                const delH = Math.max(
                  d.delivered ? 8 : 0,
                  (d.delivered / maxDay) * 100,
                );
                return (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <p className="text-[11px] font-bold tabular-nums text-ink">
                      {d.total || "·"}
                    </p>
                    <div className="flex h-40 w-full items-end justify-center gap-1 sm:h-44">
                      <div
                        className="w-[40%] rounded-t bg-brand"
                        style={{ height: `${createH}%` }}
                        title={`Créations ${d.total}`}
                      />
                      <div
                        className="w-[40%] rounded-t bg-ink/35"
                        style={{ height: `${delH}%` }}
                        title={`Livrés ${d.delivered}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-ink-muted">
                      {d.label}
                    </span>
                  </div>
                );
              }
              const extH = Math.max(
                d.external ? 10 : 0,
                (d.external / maxDay) * 100,
              );
              const intH = Math.max(
                d.internal ? 10 : 0,
                (d.internal / maxDay) * 100,
              );
              return (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <p className="text-[11px] font-bold tabular-nums text-ink">
                    {d.total || "·"}
                  </p>
                  <div className="flex h-40 w-full items-end justify-center gap-1 sm:h-44">
                    <div
                      className="w-[40%] rounded-t bg-chart-ext"
                      style={{ height: `${extH}%` }}
                    />
                    <div
                      className="w-[40%] rounded-t bg-chart-int"
                      style={{ height: `${intH}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-ink-muted">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {!loading && kpis ? (
        <section className="an-reveal grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-cream bg-surface p-5">
            <p className="text-sm font-semibold text-ink-muted">Pipeline</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">
              {kpis.awaiting + kpis.inProgress}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {kpis.awaiting} attente · {kpis.inProgress} en cours
            </p>
          </article>
          <article className="rounded-2xl border border-cream bg-surface p-5">
            <p className="text-sm font-semibold text-ink-muted">Livrés</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">
              {kpis.delivered}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Taux {kpis.deliveryRate}%
            </p>
          </article>
          <article className="rounded-2xl border border-cream bg-surface p-5">
            <p className="text-sm font-semibold text-ink-muted">Retours</p>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink">
              {kpis.returns}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Taux {kpis.returnRate}%
            </p>
          </article>
        </section>
      ) : null}
    </div>
  );
}
