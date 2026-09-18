export type StatusKey =
  | "NON_SERIEUX"
  | "EN_ATTENTE"
  | "A_ENLEVER"
  | "ENLEVES"
  | "AU_DEPOT"
  | "RETOUR_DEPOT"
  | "EN_COURS"
  | "A_VERIFIER"
  | "LIVRES"
  | "LIVRES_PAYES"
  | "ECHANGES"
  | "REMBOURSES"
  | "RETOUR_DEFINITIF"
  | "RETOUR_INTER_AGENCE"
  | "RETOUR_EXPEDITEURS"
  | "RETOUR_RECU"
  | "SAISIE_DOUANE";

/** Exact Navex dashboard card colors (sampled from app.navex.tn) */
export const STATUS_META: Record<
  StatusKey,
  { label: string; color: string; ink?: string; emoji: string }
> = {
  NON_SERIEUX: { label: "Non sérieux", color: "#FF6B6B", emoji: "🚫" },
  EN_ATTENTE: {
    label: "En attente",
    color: "#FFDBA4",
    ink: "#5C4816",
    emoji: "⏳",
  },
  A_ENLEVER: {
    label: "À enlever",
    color: "#ECC5FB",
    ink: "#4A2A5C",
    emoji: "📦",
  },
  ENLEVES: {
    label: "Enlevés",
    color: "#ECC5FB",
    ink: "#4A2A5C",
    emoji: "📤",
  },
  AU_DEPOT: {
    label: "Au dépôt",
    color: "#95BDFF",
    ink: "#1A3A6B",
    emoji: "🏭",
  },
  RETOUR_DEPOT: {
    label: "Retour dépôt",
    color: "#95BDFF",
    ink: "#1A3A6B",
    emoji: "↩️",
  },
  EN_COURS: {
    label: "En cours",
    color: "#90C8AC",
    ink: "#1A4A35",
    emoji: "🚚",
  },
  A_VERIFIER: {
    label: "À vérifier",
    color: "#FF8AAE",
    ink: "#6B1A35",
    emoji: "🔍",
  },
  LIVRES: { label: "Livrés", color: "#3FA796", emoji: "✅" },
  LIVRES_PAYES: { label: "Livrés payés", color: "#3FA796", emoji: "💰" },
  ECHANGES: { label: "Échanges", color: "#8FA60B", emoji: "🔄" },
  REMBOURSES: { label: "Remboursés", color: "#8FA60B", emoji: "💸" },
  RETOUR_DEFINITIF: { label: "Retour définitif", color: "#FF4A4A", emoji: "❌" },
  RETOUR_INTER_AGENCE: {
    label: "Retour Inter-agence",
    color: "#FF4A4A",
    emoji: "🔁",
  },
  RETOUR_EXPEDITEURS: {
    label: "Retour Expéditeurs",
    color: "#FF4A4A",
    emoji: "📬",
  },
  RETOUR_RECU: { label: "Retour reçu", color: "#FF4A4A", emoji: "📥" },
  SAISIE_DOUANE: {
    label: "Saisie par la Douane",
    color: "#4C4C4C",
    emoji: "🛃",
  },
};

export const RETURN_STATUSES: StatusKey[] = [
  "RETOUR_DEFINITIF",
  "RETOUR_INTER_AGENCE",
  "RETOUR_EXPEDITEURS",
  "RETOUR_RECU",
  "RETOUR_DEPOT",
];

export const TUNISIA_GOVERNORATES = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "La Mannouba",
  "Le Kef",
  "Mahdia",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;
