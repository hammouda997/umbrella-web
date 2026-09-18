import type { StatusKey } from "@/lib/status-meta";

export type LivreurAction = {
  id: string;
  label: string;
  emoji: string;
  status: StatusKey;
  tone: "primary" | "success" | "warn" | "danger" | "neutral";
  needsComment?: boolean;
  commentLabel?: string;
};

/** Contextual driver actions (Navex-style pickup/delivery). */
export function livreurActionsFor(status: string): LivreurAction[] {
  switch (status) {
    case "A_ENLEVER":
    case "EN_ATTENTE":
      return [
        {
          id: "pickup",
          label: "Enlevé",
          emoji: "📦",
          status: "ENLEVES",
          tone: "primary",
        },
        {
          id: "cancel-sender",
          label: "Annulé expéditeur",
          emoji: "🚫",
          status: "RETOUR_EXPEDITEURS",
          tone: "danger",
          needsComment: true,
          commentLabel: "Motif",
        },
      ];
    case "ENLEVES":
    case "AU_DEPOT":
      return [
        {
          id: "out",
          label: "En livraison",
          emoji: "🛵",
          status: "EN_COURS",
          tone: "primary",
        },
        {
          id: "depot",
          label: "Au dépôt",
          emoji: "🏭",
          status: "AU_DEPOT",
          tone: "neutral",
        },
      ];
    case "EN_COURS":
    case "A_VERIFIER":
      return [
        {
          id: "delivered",
          label: "Livré",
          emoji: "✅",
          status: "LIVRES",
          tone: "success",
        },
        {
          id: "unavailable",
          label: "Client indisponible",
          emoji: "📵",
          status: "A_VERIFIER",
          tone: "warn",
          needsComment: true,
          commentLabel: "Détail (horaire, etc.)",
        },
        {
          id: "reschedule",
          label: "Reporté",
          emoji: "📅",
          status: "A_VERIFIER",
          tone: "warn",
          needsComment: true,
          commentLabel: "Nouvelle date",
        },
        {
          id: "bad-phone",
          label: "Tél / adresse incorrect",
          emoji: "⚠️",
          status: "A_VERIFIER",
          tone: "danger",
          needsComment: true,
          commentLabel: "Explication",
        },
        {
          id: "exchange",
          label: "Échange",
          emoji: "🔄",
          status: "ECHANGES",
          tone: "neutral",
          needsComment: true,
          commentLabel: "Détail échange",
        },
        {
          id: "return",
          label: "Retour dépôt",
          emoji: "↩️",
          status: "RETOUR_DEPOT",
          tone: "danger",
          needsComment: true,
          commentLabel: "Motif retour",
        },
      ];
    case "LIVRES":
      return [
        {
          id: "paid",
          label: "Livré payé",
          emoji: "💵",
          status: "LIVRES_PAYES",
          tone: "success",
        },
      ];
    default:
      return [
        {
          id: "out",
          label: "En livraison",
          emoji: "🛵",
          status: "EN_COURS",
          tone: "primary",
        },
        {
          id: "delivered",
          label: "Livré",
          emoji: "✅",
          status: "LIVRES",
          tone: "success",
        },
        {
          id: "return",
          label: "Retour dépôt",
          emoji: "↩️",
          status: "RETOUR_DEPOT",
          tone: "danger",
          needsComment: true,
          commentLabel: "Motif",
        },
      ];
  }
}

export const ACTION_TONE_CLASS: Record<LivreurAction["tone"], string> = {
  primary: "bg-brand text-white hover:bg-brand-soft",
  success: "bg-emerald-700 text-white hover:bg-emerald-800",
  warn: "bg-amber-500 text-ink hover:bg-amber-400",
  danger: "border border-brand/40 bg-brand/10 text-brand hover:bg-brand/15",
  neutral: "border border-cream bg-surface text-ink hover:border-brand",
};
