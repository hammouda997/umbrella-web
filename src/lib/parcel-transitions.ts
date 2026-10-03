import type { AppRole } from "@/lib/roles";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

const TRANSITIONS: Record<StatusKey, readonly StatusKey[]> = {
  EN_ATTENTE: [
    "A_ENLEVER",
    "ENLEVES",
    "AU_DEPOT",
    "EN_COURS",
    "RETOUR_EXPEDITEURS",
    "NON_SERIEUX",
    "SAISIE_DOUANE",
  ],
  A_ENLEVER: ["ENLEVES", "AU_DEPOT", "RETOUR_EXPEDITEURS", "NON_SERIEUX"],
  ENLEVES: ["AU_DEPOT", "EN_COURS", "RETOUR_DEPOT"],
  AU_DEPOT: [
    "EN_COURS",
    "RETOUR_DEPOT",
    "RETOUR_INTER_AGENCE",
    "RETOUR_EXPEDITEURS",
    "SAISIE_DOUANE",
  ],
  RETOUR_DEPOT: [
    "AU_DEPOT",
    "EN_COURS",
    "RETOUR_DEFINITIF",
    "RETOUR_INTER_AGENCE",
    "RETOUR_EXPEDITEURS",
    "RETOUR_RECU",
  ],
  EN_COURS: ["LIVRES", "A_VERIFIER", "ECHANGES", "RETOUR_DEPOT", "NON_SERIEUX"],
  A_VERIFIER: ["EN_COURS", "LIVRES", "ECHANGES", "RETOUR_DEPOT", "NON_SERIEUX"],
  LIVRES: ["LIVRES_PAYES", "REMBOURSES", "RETOUR_DEPOT"],
  LIVRES_PAYES: ["REMBOURSES"],
  ECHANGES: ["LIVRES", "EN_COURS", "RETOUR_DEPOT"],
  REMBOURSES: [],
  RETOUR_DEFINITIF: ["REMBOURSES"],
  RETOUR_INTER_AGENCE: ["RETOUR_DEPOT", "RETOUR_RECU", "RETOUR_DEFINITIF"],
  RETOUR_EXPEDITEURS: ["RETOUR_RECU", "RETOUR_DEFINITIF"],
  RETOUR_RECU: ["REMBOURSES", "RETOUR_DEFINITIF"],
  SAISIE_DOUANE: ["RETOUR_DEFINITIF", "REMBOURSES"],
  NON_SERIEUX: ["EN_ATTENTE", "A_ENLEVER", "RETOUR_EXPEDITEURS"],
};

const LIVREUR_TARGETS = new Set<StatusKey>([
  "ENLEVES",
  "AU_DEPOT",
  "EN_COURS",
  "A_VERIFIER",
  "LIVRES",
  "LIVRES_PAYES",
  "ECHANGES",
  "RETOUR_DEPOT",
  "RETOUR_EXPEDITEURS",
  "NON_SERIEUX",
]);

const PICKUP_TARGETS = new Set<StatusKey>(["A_ENLEVER", "ENLEVES", "AU_DEPOT"]);

const MAGASINIER_TARGETS = new Set<StatusKey>([
  "AU_DEPOT",
  "EN_COURS",
  "RETOUR_DEPOT",
  "RETOUR_INTER_AGENCE",
  "RETOUR_EXPEDITEURS",
  "RETOUR_RECU",
]);

const SUPPORT_TARGETS = new Set<StatusKey>([
  "RETOUR_DEPOT",
  "RETOUR_INTER_AGENCE",
  "RETOUR_EXPEDITEURS",
  "RETOUR_RECU",
  "RETOUR_DEFINITIF",
]);

const COMMENT_REQUIRED = new Set<StatusKey>([
  "A_VERIFIER",
  "RETOUR_DEPOT",
  "RETOUR_EXPEDITEURS",
  "RETOUR_DEFINITIF",
  "RETOUR_INTER_AGENCE",
  "NON_SERIEUX",
  "ECHANGES",
  "SAISIE_DOUANE",
  "REMBOURSES",
]);

export function isStatusKey(value: string): value is StatusKey {
  return value in STATUS_META;
}

export function allowedTargets(from: string): StatusKey[] {
  if (!isStatusKey(from)) return [];
  return [...TRANSITIONS[from]];
}

export function requiresComment(to: string, from: string): boolean {
  if (from === to) return false;
  return isStatusKey(to) && COMMENT_REQUIRED.has(to);
}

export function canTransition(
  from: string,
  to: string,
  role: AppRole,
): { ok: true } | { ok: false; reason: string } {
  if (from === to) return { ok: true };
  if (!isStatusKey(from) || !isStatusKey(to)) {
    return { ok: false, reason: "Statut invalide" };
  }
  if (!TRANSITIONS[from].includes(to)) {
    const a = STATUS_META[from]?.label ?? from;
    const b = STATUS_META[to]?.label ?? to;
    return { ok: false, reason: `Impossible : ${a} → ${b}` };
  }
  if (role === "LIVREUR" && !LIVREUR_TARGETS.has(to)) {
    return {
      ok: false,
      reason: `Action réservée au dépôt (${STATUS_META[to].label})`,
    };
  }
  if (role === "PICKUP" && !PICKUP_TARGETS.has(to)) {
    return {
      ok: false,
      reason: `Pickup : transition non autorisée vers ${STATUS_META[to].label}`,
    };
  }
  if (role === "MAGASINIER" && !MAGASINIER_TARGETS.has(to)) {
    return {
      ok: false,
      reason: `Magasinier : transition non autorisée vers ${STATUS_META[to].label}`,
    };
  }
  if (role === "SUPPORT" && !SUPPORT_TARGETS.has(to)) {
    return {
      ok: false,
      reason: "Support : seuls les retours peuvent être vérifiés",
    };
  }
  return { ok: true };
}

export function selectableStatuses(
  current: string,
  role: AppRole,
): StatusKey[] {
  const next = allowedTargets(current).filter((to) =>
    canTransition(current, to, role).ok,
  );
  if (isStatusKey(current) && !next.includes(current)) {
    return [current, ...next];
  }
  return next;
}
