import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import type { Parcel, TimelineEntry } from "@/lib/domain";

export type ParcoursKind = "LIVRAISON" | "RETOUR";

export type ParcoursStep = {
  key: StatusKey;
  label: string;
  done: boolean;
  current: boolean;
  upcoming: boolean;
};

const LIVRAISON_STEPS: StatusKey[] = [
  "EN_ATTENTE",
  "ENLEVES",
  "AU_DEPOT",
  "EXPEDIE_DESTINATION",
  "ARRIVE_DESTINATION",
  "AFFECTE_LIVREUR",
  "EN_COURS",
  "LIVRES",
];

const RETOUR_STEPS: StatusKey[] = [
  "LIVRAISON_ANNULEE",
  "RETOUR_DEPOT",
  "RETOUR_EXPEDITEURS",
  "RETOUR_RECU",
];

const DISPATCHED_STATUSES = new Set<string>([
  "AFFECTE_LIVREUR",
  "EN_COURS",
  "A_VERIFIER",
  "LIVRES",
  "LIVRES_PAYES",
  "ECHANGES",
]);

const IN_TRANSIT_STATUSES = new Set<string>([
  "EXPEDIE_DESTINATION",
  "ARRIVE_DESTINATION",
  "AFFECTE_LIVREUR",
  "EN_COURS",
]);

export function detectParcoursKind(status: string): ParcoursKind {
  if (
    status === "LIVRAISON_ANNULEE" ||
    status.startsWith("RETOUR") ||
    status === "SAISIE_DOUANE"
  ) {
    return "RETOUR";
  }
  return "LIVRAISON";
}

export function parcoursStepsFor(kind: ParcoursKind): StatusKey[] {
  return kind === "RETOUR" ? RETOUR_STEPS : LIVRAISON_STEPS;
}

export function parcoursLabel(kind: ParcoursKind): string {
  return kind === "RETOUR"
    ? "Parcours retour"
    : "Parcours livraison";
}

export function buildParcours(status: string): {
  kind: ParcoursKind;
  label: string;
  steps: ParcoursStep[];
  nextKey: StatusKey | null;
  nextLabel: string | null;
} {
  const kind = detectParcoursKind(status);
  const path = parcoursStepsFor(kind);
  let idx = path.indexOf(status as StatusKey);

  if (kind === "LIVRAISON" && status === "A_ENLEVER") {
    idx = path.indexOf("EN_ATTENTE");
  }
  if (status === "LIVRES_PAYES" || status === "REMBOURSES") {
    idx = path.length - 1;
  }

  const steps: ParcoursStep[] = path.map((key, i) => ({
    key,
    label: STATUS_META[key]?.label ?? key,
    done: idx >= 0 && i < idx,
    current: idx >= 0 && i === idx,
    upcoming: idx < 0 ? i === 0 : i > idx,
  }));

  const nextKey =
    idx < 0 ? path[0] ?? null : idx < path.length - 1 ? path[idx + 1]! : null;

  return {
    kind,
    label: parcoursLabel(kind),
    steps,
    nextKey,
    nextLabel: nextKey ? (STATUS_META[nextKey]?.label ?? nextKey) : null,
  };
}

export function isDispatched(parcel: Parcel): boolean {
  if (parcel.driverId || parcel.driver?.name) return true;
  return DISPATCHED_STATUSES.has(parcel.status);
}

export function isInTransit(status: string): boolean {
  return IN_TRANSIT_STATUSES.has(status);
}

export function lastTimelineActor(
  timeline: TimelineEntry[] | undefined,
): string | null {
  if (!timeline?.length) return null;
  const sorted = [...timeline].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  for (const entry of sorted) {
    if (entry.actor?.trim()) return entry.actor.trim();
  }
  return null;
}

export function dispatchLabel(parcel: Parcel): string {
  if (parcel.status === "EN_COURS" || parcel.status === "A_VERIFIER") {
    return "En tournée";
  }
  if (parcel.status === "AFFECTE_LIVREUR") {
    return "Affecté";
  }
  if (
    parcel.status === "LIVRES" ||
    parcel.status === "LIVRES_PAYES" ||
    parcel.status === "ECHANGES"
  ) {
    return "Livré";
  }
  if (parcel.driver?.name || parcel.driverId) {
    return "Livreur assigné";
  }
  return "Non dispatché";
}
