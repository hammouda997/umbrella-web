export const ANALYTICS_PREFS_STORAGE_KEY = "umbrella.analytics.prefs.v1";

export type AnalyticsChartType = "bars" | "lines" | "area" | "donut";

export type AnalyticsSeriesKey =
  | "creations"
  | "delivered"
  | "external"
  | "internal"
  | "returns"
  | "rates"
  | "soldes"
  | "pipeline";

export type AnalyticsSeriesFlags = Record<AnalyticsSeriesKey, boolean>;

export type AnalyticsPrefs = {
  chartType: AnalyticsChartType;
  series: AnalyticsSeriesFlags;
};

export const SERIES_META: Record<
  AnalyticsSeriesKey,
  { label: string; hint: string; opsOnly?: boolean; modesOnly?: boolean; senderFocus?: boolean }
> = {
  creations: {
    label: "Créations",
    hint: "Nouveaux colis sur 7 jours",
  },
  delivered: {
    label: "Livrés",
    hint: "Colis livrés sur 7 jours",
  },
  external: {
    label: "EXTERNAL",
    hint: "Canal app.navex.tn",
    modesOnly: true,
  },
  internal: {
    label: "INTERNAL",
    hint: "Livraison zones / flotte",
    modesOnly: true,
  },
  returns: {
    label: "Retours",
    hint: "Part des retours dans le total",
  },
  rates: {
    label: "Taux",
    hint: "Livraison et retours en %",
  },
  soldes: {
    label: "Soldes",
    hint: "Répartition des montants COD",
    senderFocus: true,
  },
  pipeline: {
    label: "Pipeline",
    hint: "Attente, en cours, livrés…",
  },
};

export const CHART_TYPE_OPTIONS: Array<{
  value: AnalyticsChartType;
  label: string;
  hint: string;
}> = [
  { value: "bars", label: "Barres", hint: "Comparer jour par jour" },
  { value: "lines", label: "Courbes", hint: "Voir la tendance" },
  { value: "area", label: "Aires", hint: "Volume rempli" },
  { value: "donut", label: "Camembert", hint: "Répartitions" },
];

const DEFAULT_SERIES: AnalyticsSeriesFlags = {
  creations: true,
  delivered: true,
  external: true,
  internal: true,
  returns: true,
  rates: true,
  soldes: true,
  pipeline: true,
};

export function defaultAnalyticsPrefs(showModes: boolean): AnalyticsPrefs {
  return {
    chartType: "bars",
    series: {
      ...DEFAULT_SERIES,
      external: showModes,
      internal: showModes,
    },
  };
}

export function prefsPageKey(basePath: string): string {
  const cleaned = basePath.replace(/^\//, "").replace(/\/$/, "") || "admin";
  return cleaned;
}

function isChartType(value: unknown): value is AnalyticsChartType {
  return (
    value === "bars" ||
    value === "lines" ||
    value === "area" ||
    value === "donut"
  );
}

function parseSeries(raw: unknown, showModes: boolean): AnalyticsSeriesFlags {
  const base = defaultAnalyticsPrefs(showModes).series;
  if (!raw || typeof raw !== "object") return base;
  const input = raw as Record<string, unknown>;
  const next = { ...base };
  (Object.keys(base) as AnalyticsSeriesKey[]).forEach((key) => {
    if (typeof input[key] === "boolean") {
      next[key] = input[key];
    }
  });
  if (!showModes) {
    next.external = false;
    next.internal = false;
  }
  return next;
}

export function loadAnalyticsPrefs(
  pageKey: string,
  showModes: boolean,
): AnalyticsPrefs {
  const fallback = defaultAnalyticsPrefs(showModes);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(ANALYTICS_PREFS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const page = parsed[pageKey];
    if (!page || typeof page !== "object") return fallback;
    const entry = page as Record<string, unknown>;
    return {
      chartType: isChartType(entry.chartType) ? entry.chartType : fallback.chartType,
      series: parseSeries(entry.series, showModes),
    };
  } catch {
    return fallback;
  }
}

export function saveAnalyticsPrefs(pageKey: string, prefs: AnalyticsPrefs): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(ANALYTICS_PREFS_STORAGE_KEY);
    const store = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    store[pageKey] = prefs;
    window.localStorage.setItem(
      ANALYTICS_PREFS_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    // ignore quota / private mode
  }
}
