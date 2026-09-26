"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, Wallet } from "lucide-react";
import {
  DonutSvg,
  RateMeter,
  SERIES_COLORS,
  TimeSeriesSvg,
} from "@/components/analytics-charts";
import { apiFetch } from "@/lib/api";
import {
  CHART_TYPE_OPTIONS,
  SERIES_META,
  type AnalyticsChartType,
  type AnalyticsPrefs,
  type AnalyticsSeriesKey,
  defaultAnalyticsPrefs,
  loadAnalyticsPrefs,
  prefsPageKey,
  saveAnalyticsPrefs,
} from "@/lib/analytics-prefs";
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

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; hint: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div
      className="inline-flex flex-wrap gap-0.5 rounded-lg border border-cream bg-cream-soft/50 p-0.5"
      role="radiogroup"
      aria-label="Type de graphique"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.hint}
            onClick={() => onChange(opt.value)}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              active
                ? "bg-brand text-white"
                : "text-ink-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SeriesChecklist({
  keys,
  series,
  onToggle,
}: {
  keys: AnalyticsSeriesKey[];
  series: AnalyticsPrefs["series"];
  onToggle: (key: AnalyticsSeriesKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Séries">
      {keys.map((key) => {
        const meta = SERIES_META[key];
        const checked = series[key];
        return (
          <label
            key={key}
            title={meta.hint}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
              checked
                ? "border-brand bg-brand text-white"
                : "border-cream bg-surface text-ink hover:border-brand/40"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => onToggle(key)}
            />
            {meta.label}
          </label>
        );
      })}
    </div>
  );
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
  const pageKey = prefsPageKey(basePath);

  const [prefs, setPrefs] = useState<AnalyticsPrefs>(() =>
    defaultAnalyticsPrefs(showModes),
  );
  const [prefsReady, setPrefsReady] = useState(false);

  useEffect(() => {
    setPrefs(loadAnalyticsPrefs(pageKey, showModes));
    setPrefsReady(true);
  }, [pageKey, showModes]);

  useEffect(() => {
    if (!prefsReady) return;
    saveAnalyticsPrefs(pageKey, prefs);
  }, [prefs, pageKey, prefsReady]);

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

  const weekTotal = useMemo(
    () => analytics?.last7Days.reduce((s, d) => s + d.total, 0) ?? 0,
    [analytics],
  );

  const weekDelivered = useMemo(
    () => analytics?.last7Days.reduce((s, d) => s + d.delivered, 0) ?? 0,
    [analytics],
  );

  const availableSeriesKeys = useMemo(() => {
    const keys: AnalyticsSeriesKey[] = [
      "creations",
      "delivered",
      "returns",
      "rates",
      "pipeline",
    ];
    if (showModes) {
      keys.splice(2, 0, "external", "internal");
    }
    if (analytics?.soldes) {
      keys.push("soldes");
    }
    return keys;
  }, [showModes, analytics?.soldes]);

  const timeSeries = useMemo(() => {
    if (!analytics) return [];
    const days = analytics.last7Days;
    const out: Array<{
      key: string;
      label: string;
      color: string;
      values: number[];
    }> = [];
    if (prefs.series.creations) {
      out.push({
        key: "creations",
        label: "Créations",
        color: SERIES_COLORS.creations,
        values: days.map((d) => d.total),
      });
    }
    if (prefs.series.delivered) {
      out.push({
        key: "delivered",
        label: "Livrés",
        color: SERIES_COLORS.delivered,
        values: days.map((d) => d.delivered),
      });
    }
    if (showModes && prefs.series.external) {
      out.push({
        key: "external",
        label: "EXTERNAL",
        color: SERIES_COLORS.external,
        values: days.map((d) => d.external),
      });
    }
    if (showModes && prefs.series.internal) {
      out.push({
        key: "internal",
        label: "INTERNAL",
        color: SERIES_COLORS.internal,
        values: days.map((d) => d.internal),
      });
    }
    return out;
  }, [analytics, prefs.series, showModes]);

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
  const chartType = prefs.chartType;

  const setChartType = (next: AnalyticsChartType) => {
    setPrefs((prev) => ({ ...prev, chartType: next }));
  };

  const toggleSeries = (key: AnalyticsSeriesKey) => {
    setPrefs((prev) => ({
      ...prev,
      series: { ...prev.series, [key]: !prev.series[key] },
    }));
  };

  const pipelineSlices = kpis
    ? [
        {
          key: "awaiting",
          label: "En attente",
          value: kpis.awaiting,
          color: SERIES_COLORS.awaiting,
        },
        {
          key: "inProgress",
          label: "En cours",
          value: kpis.inProgress,
          color: SERIES_COLORS.inProgress,
        },
        {
          key: "delivered",
          label: "Livrés",
          value: kpis.delivered,
          color: SERIES_COLORS.delivered,
        },
        ...(prefs.series.returns
          ? [
              {
                key: "returns",
                label: "Retours",
                value: kpis.returns,
                color: SERIES_COLORS.returns,
              },
            ]
          : []),
        {
          key: "exchanges",
          label: "Échanges",
          value: kpis.exchanges ?? 0,
          color: SERIES_COLORS.exchanges,
        },
      ].filter((s) => s.value > 0 || s.key === "delivered")
    : [];

  const modeSlices = kpis
    ? [
        {
          key: "external",
          label: "EXTERNAL",
          value: kpis.external,
          color: SERIES_COLORS.external,
        },
        {
          key: "internal",
          label: "INTERNAL",
          value: kpis.internal,
          color: SERIES_COLORS.internal,
        },
      ]
    : [];

  const soldesSlices = soldes
    ? [
        {
          key: "disponible",
          label: "Disponible",
          value: soldes.disponible,
          color: SERIES_COLORS.disponible,
        },
        {
          key: "enDemande",
          label: "En demande",
          value: soldes.enDemande,
          color: SERIES_COLORS.enDemande,
        },
        {
          key: "aVerser",
          label: "À verser",
          value: soldes.aVerser,
          color: SERIES_COLORS.aVerser,
        },
        {
          key: "verse",
          label: "Versé",
          value: soldes.verse,
          color: SERIES_COLORS.verse,
        },
      ]
    : [];

  const showTimeChart = chartType !== "donut";
  const showDonuts = chartType === "donut";

  return (
    <div ref={root} className="space-y-4">
      <header className="an-reveal flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={basePath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">
            Analytics
          </h1>
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
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-cream-soft"
            />
          ))}
        </div>
      ) : null}

      {!loading && kpis ? (
        <section className="an-reveal grid grid-cols-2 gap-2 lg:grid-cols-4">
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
              className="rounded-xl border border-cream bg-surface px-3 py-2.5"
            >
              <p className="text-[11px] font-semibold text-ink-muted">
                {card.label}
              </p>
              <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-ink">
                {card.value}
              </p>
              <p className="text-[11px] text-ink-muted">{card.hint}</p>
            </article>
          ))}
        </section>
      ) : null}

      {!loading && soldes ? (
        <section className="an-reveal space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {isSender ? "Soldes & versements" : "Soldes COD réseau"}
          </h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
                className={`rounded-xl border px-3 py-2 ${
                  card.accent
                    ? "border-brand/30 bg-brand/[0.06]"
                    : "border-cream bg-surface"
                }`}
              >
                <p className="text-[11px] font-semibold text-ink-muted">
                  {card.label}
                </p>
                <p
                  className={`font-display text-lg font-extrabold tabular-nums ${
                    card.accent ? "text-brand" : "text-ink"
                  }`}
                >
                  {card.value}
                </p>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-xl border border-cream bg-surface px-3 py-2 text-xs">
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
        <section className="an-reveal space-y-3 rounded-xl border border-cream bg-surface p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <SegmentedToggle
              options={CHART_TYPE_OPTIONS}
              value={chartType}
              onChange={setChartType}
            />
            <span className="hidden h-4 w-px bg-cream sm:block" aria-hidden />
            <SeriesChecklist
              keys={availableSeriesKeys}
              series={prefs.series}
              onToggle={toggleSeries}
            />
          </div>

          {showTimeChart ? (
            <div className="space-y-3 border-t border-cream pt-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    Volume 7 jours
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {weekTotal} créations · {weekDelivered} livrés
                    {showModes ? " · External vs Internal" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink">
                  {timeSeries.map((s) => (
                    <span
                      key={s.key}
                      className="inline-flex items-center gap-2"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
              <TimeSeriesSvg
                type={chartType}
                labels={analytics.last7Days.map((d) => d.label)}
                series={timeSeries}
                height={200}
              />
            </div>
          ) : null}

          {showDonuts ? (
            <div className="grid gap-3 border-t border-cream pt-3 lg:grid-cols-2">
              {prefs.series.pipeline && pipelineSlices.length ? (
                <article className="rounded-xl border border-cream bg-page/40 p-3">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Répartition du pipeline
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Où en sont vos colis
                  </p>
                  <div className="mt-4">
                    <DonutSvg
                      slices={pipelineSlices}
                      centerLabel="colis"
                      centerValue={String(kpis?.total ?? 0)}
                    />
                  </div>
                </article>
              ) : null}

              {showModes &&
              (prefs.series.external || prefs.series.internal) ? (
                <article className="rounded-xl border border-cream bg-page/40 p-3">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Canaux de livraison
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    EXTERNAL vs INTERNAL
                  </p>
                  <div className="mt-4">
                    <DonutSvg
                      slices={modeSlices.filter((s) => {
                        if (s.key === "external") return prefs.series.external;
                        if (s.key === "internal") return prefs.series.internal;
                        return true;
                      })}
                      centerLabel="canaux"
                      centerValue={String(
                        (prefs.series.external ? (kpis?.external ?? 0) : 0) +
                          (prefs.series.internal ? (kpis?.internal ?? 0) : 0),
                      )}
                    />
                  </div>
                </article>
              ) : null}

              {prefs.series.soldes && soldesSlices.length ? (
                <article className="rounded-xl border border-cream bg-page/40 p-3">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Soldes COD
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Répartition des montants
                  </p>
                  <div className="mt-4">
                    <DonutSvg
                      slices={soldesSlices}
                      centerLabel="TND"
                      centerValue={formatMoney(
                        soldesSlices.reduce((s, x) => s + x.value, 0),
                      ).replace(/\s/g, "\u00a0")}
                    />
                  </div>
                </article>
              ) : null}

              {prefs.series.returns && kpis ? (
                <article className="rounded-xl border border-cream bg-page/40 p-3">
                  <h3 className="font-display text-sm font-bold text-ink">
                    Livrés vs retours
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Issue des colis traités
                  </p>
                  <div className="mt-4">
                    <DonutSvg
                      slices={[
                        {
                          key: "delivered",
                          label: "Livrés",
                          value: kpis.delivered,
                          color: SERIES_COLORS.delivered,
                        },
                        {
                          key: "returns",
                          label: "Retours",
                          value: kpis.returns,
                          color: SERIES_COLORS.returns,
                        },
                      ]}
                      centerLabel="issues"
                      centerValue={String(kpis.delivered + kpis.returns)}
                    />
                  </div>
                </article>
              ) : null}

              {!prefs.series.pipeline &&
              !prefs.series.returns &&
              !prefs.series.soldes &&
              !(showModes && (prefs.series.external || prefs.series.internal)) ? (
                <p className="col-span-full rounded-xl border border-dashed border-cream px-3 py-4 text-center text-xs text-ink-muted">
                  Cochez au moins une répartition (pipeline, retours, soldes…)
                  pour afficher un camembert.
                </p>
              ) : null}
            </div>
          ) : null}

          {!showDonuts && prefs.series.pipeline && kpis ? (
            <div className="grid gap-2 border-t border-cream pt-3 sm:grid-cols-3">
              <article className="rounded-xl border border-cream bg-page/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-ink-muted">Pipeline</p>
                <p className="font-display text-lg font-extrabold text-ink">
                  {kpis.awaiting + kpis.inProgress}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {kpis.awaiting} attente · {kpis.inProgress} en cours
                </p>
              </article>
              <article className="rounded-xl border border-cream bg-page/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-ink-muted">Livrés</p>
                <p className="font-display text-lg font-extrabold text-ink">
                  {kpis.delivered}
                </p>
                <p className="text-[11px] text-ink-muted">
                  Taux {kpis.deliveryRate}%
                </p>
              </article>
              <article className="rounded-xl border border-cream bg-page/40 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-ink-muted">Retours</p>
                <p className="font-display text-lg font-extrabold text-ink">
                  {kpis.returns}
                </p>
                <p className="text-[11px] text-ink-muted">
                  Taux {kpis.returnRate}%
                </p>
              </article>
            </div>
          ) : null}

          {prefs.series.rates && kpis ? (
            <div className="grid gap-2 border-t border-cream pt-3 sm:grid-cols-2">
              <RateMeter
                label="Taux de livraison"
                value={kpis.deliveryRate}
                hint={`${kpis.delivered} livrés sur ${kpis.total}`}
                color="var(--color-brand)"
              />
              <RateMeter
                label="Taux de retour"
                value={kpis.returnRate}
                hint={`${kpis.returns} retours`}
                color="var(--color-gold)"
              />
            </div>
          ) : null}

          {!showDonuts &&
          prefs.series.soldes &&
          soldesSlices.some((s) => s.value > 0) ? (
            <div className="border-t border-cream pt-3">
              <h3 className="font-display text-sm font-bold text-ink">
                Répartition des soldes
              </h3>
              <div className="mt-2 max-w-xl">
                <DonutSvg
                  slices={soldesSlices}
                  centerLabel="soldes"
                  centerValue={formatMoney(
                    soldesSlices.reduce((s, x) => s + x.value, 0),
                  ).replace(/\s/g, "\u00a0")}
                />
              </div>
            </div>
          ) : null}

          {!showDonuts &&
          showModes &&
          (prefs.series.external || prefs.series.internal) &&
          kpis ? (
            <div className="border-t border-cream pt-3">
              <h3 className="font-display text-sm font-bold text-ink">
                Part EXTERNAL / INTERNAL
              </h3>
              <div className="mt-2 max-w-xl">
                <DonutSvg
                  slices={modeSlices.filter((s) => {
                    if (s.key === "external") return prefs.series.external;
                    if (s.key === "internal") return prefs.series.internal;
                    return true;
                  })}
                  centerLabel="colis"
                  centerValue={String(kpis.total)}
                />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

    </div>
  );
}
