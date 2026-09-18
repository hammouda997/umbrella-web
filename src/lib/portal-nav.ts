import { STATUS_META, type StatusKey } from "@/lib/status-meta";

export const STATUS_ORDER: StatusKey[] = [
  "NON_SERIEUX",
  "EN_ATTENTE",
  "A_ENLEVER",
  "ENLEVES",
  "AU_DEPOT",
  "RETOUR_DEPOT",
  "EN_COURS",
  "A_VERIFIER",
  "LIVRES",
  "LIVRES_PAYES",
  "ECHANGES",
  "REMBOURSES",
  "RETOUR_DEFINITIF",
  "RETOUR_INTER_AGENCE",
  "RETOUR_EXPEDITEURS",
  "RETOUR_RECU",
  "SAISIE_DOUANE",
];

export function colisStatusHref(basePath: string, status: StatusKey) {
  return `${basePath}/parcels?status=${encodeURIComponent(status)}`;
}

export function colisNavChildren(basePath: string) {
  return [
    { href: `${basePath}/parcels`, label: "Tous les colis" },
    { href: `${basePath}/nouveau`, label: "Ajouter colis" },
    ...STATUS_ORDER.map((key) => ({
      href: colisStatusHref(basePath, key),
      label: `${STATUS_META[key].emoji} ${STATUS_META[key].label}`,
    })),
  ];
}
