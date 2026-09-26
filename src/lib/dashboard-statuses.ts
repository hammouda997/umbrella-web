import type { StatusKey } from "@/lib/status-meta";

/** Pipeline statuses shown on the dashboard and the parcels filter bar. */
export const DASHBOARD_STATUS_KEYS: StatusKey[] = [
  "EN_ATTENTE",
  "A_ENLEVER",
  "ENLEVES",
  "AU_DEPOT",
  "EN_COURS",
  "A_VERIFIER",
  "LIVRES",
  "LIVRES_PAYES",
  "RETOUR_DEPOT",
];

