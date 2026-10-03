import { DASHBOARD_STATUS_KEYS } from "@/lib/dashboard-statuses";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

/** Unique visual tone per KPI card (must not reuse across dashboard statuses). */
export type OpsKpiTone =
  | "brand"
  | "green"
  | "sky"
  | "blue"
  | "rose"
  | "violet"
  | "teal"
  | "amber"
  | "orange"
  | "slate"
  | "gold"
  | "pink";

export type OpsKpi = {
  label: string;
  value: string;
  href: string;
  icon: "package" | "clock" | "truck" | "check" | "return" | "coins" | "alert";
  tone: OpsKpiTone;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  accent: string;
  glow: string;
};

const STATUS_KPI_STYLE: Record<
  StatusKey,
  Pick<OpsKpi, "icon" | "tone" | "accent" | "glow">
> = {
  NON_SERIEUX: {
    icon: "alert",
    tone: "rose",
    accent: "bg-[#3a1a1f] text-[#fb7185]",
    glow: "shadow-[0_0_32px_rgba(225,29,72,0.14)]",
  },
  EN_ATTENTE: {
    icon: "clock",
    tone: "green",
    accent: "bg-[#14291f] text-[#34d399]",
    glow: "shadow-[0_0_32px_rgba(16,185,129,0.14)]",
  },
  A_ENLEVER: {
    icon: "package",
    tone: "pink",
    accent: "bg-[#2a1f36] text-[#d8b4fe]",
    glow: "shadow-[0_0_32px_rgba(168,85,247,0.12)]",
  },
  ENLEVES: {
    icon: "package",
    tone: "violet",
    accent: "bg-[#2a1f36] text-[#d8b4fe]",
    glow: "shadow-[0_0_32px_rgba(168,85,247,0.12)]",
  },
  AU_DEPOT: {
    icon: "truck",
    tone: "sky",
    accent: "bg-[#152536] text-[#38bdf8]",
    glow: "shadow-[0_0_32px_rgba(14,165,233,0.14)]",
  },
  RETOUR_DEPOT: {
    icon: "return",
    tone: "orange",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  EN_COURS: {
    icon: "truck",
    tone: "blue",
    accent: "bg-[#152536] text-[#38bdf8]",
    glow: "shadow-[0_0_32px_rgba(14,165,233,0.14)]",
  },
  A_VERIFIER: {
    icon: "alert",
    tone: "pink",
    accent: "bg-[#3a1a28] text-[#fda4af]",
    glow: "shadow-[0_0_32px_rgba(244,63,94,0.12)]",
  },
  LIVRES: {
    icon: "check",
    tone: "violet",
    accent: "bg-[#261a3a] text-[#c4b5fd]",
    glow: "shadow-[0_0_32px_rgba(139,92,246,0.14)]",
  },
  LIVRES_PAYES: {
    icon: "coins",
    tone: "teal",
    accent: "bg-[#14291f] text-[#6ee7b7]",
    glow: "shadow-[0_0_32px_rgba(16,185,129,0.12)]",
  },
  ECHANGES: {
    icon: "return",
    tone: "gold",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  REMBOURSES: {
    icon: "coins",
    tone: "amber",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  RETOUR_DEFINITIF: {
    icon: "return",
    tone: "orange",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  RETOUR_INTER_AGENCE: {
    icon: "return",
    tone: "amber",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  RETOUR_EXPEDITEURS: {
    icon: "return",
    tone: "gold",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  RETOUR_RECU: {
    icon: "return",
    tone: "slate",
    accent: "bg-[#2f2414] text-[#fbbf24]",
    glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
  },
  SAISIE_DOUANE: {
    icon: "alert",
    tone: "slate",
    accent: "bg-[#2a2a2a] text-[#a3a3a3]",
    glow: "",
  },
};

/** Build ops KPI cards from real status counts (no synthetic “late” / fake deltas). */
export function buildOpsStatusKpis({
  basePath,
  countsByStatus,
  totalLabel = "Total",
  totalCount,
  keys = DASHBOARD_STATUS_KEYS,
}: {
  basePath: string;
  countsByStatus: Map<string, number> | Record<string, number>;
  totalLabel?: string;
  /** When set, Total card uses this (e.g. all parcels) instead of sum of `keys`. */
  totalCount?: number;
  keys?: StatusKey[];
}): OpsKpi[] {
  const get = (key: string) => {
    if (countsByStatus instanceof Map) return countsByStatus.get(key) ?? 0;
    return countsByStatus[key] ?? 0;
  };

  const keyedTotal = keys.reduce((sum, key) => sum + get(key), 0);
  const cards: OpsKpi[] = [
    {
      label: totalLabel,
      value: String(totalCount ?? keyedTotal),
      href: `${basePath}/parcels`,
      icon: "package",
      tone: "brand",
      accent: "bg-[#3a1a1f] text-[#fb7185]",
      glow: "shadow-[0_0_32px_rgba(225,29,72,0.14)]",
    },
  ];

  for (const key of keys) {
    const style = STATUS_KPI_STYLE[key];
    cards.push({
      label: STATUS_META[key].label,
      value: String(get(key)),
      href: `${basePath}/parcels?status=${encodeURIComponent(key)}`,
      icon: style.icon,
      tone: style.tone,
      accent: style.accent,
      glow: style.glow,
    });
  }

  return cards;
}

export function countByStatus(
  parcels: Array<{ status: string }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of parcels) {
    map.set(p.status, (map.get(p.status) ?? 0) + 1);
  }
  return map;
}
