"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LifeBuoy, PackageSearch } from "lucide-react";
import {
  DashboardHero,
  DashboardPromo,
} from "@/components/DashboardHero";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  Panel,
  StatCard,
  StatusBadge,
  buttonClass,
} from "@/components/ui";
import { formatTnd, type Parcel } from "@/lib/domain";
import { useApiQuery } from "@/lib/use-api";

const STEPS = ["EN_ATTENTE", "A_ENLEVER", "AU_DEPOT", "EN_COURS", "LIVRES"] as const;
const STEP_OF: Record<string, number> = {
  NON_SERIEUX: 0,
  EN_ATTENTE: 0,
  A_ENLEVER: 1,
  ENLEVES: 1,
  AU_DEPOT: 2,
  RETOUR_DEPOT: 2,
  EN_COURS: 3,
  A_VERIFIER: 3,
  LIVRES: 4,
  LIVRES_PAYES: 4,
  ECHANGES: 4,
  REMBOURSES: 4,
};

function progress(status: string) {
  const step = STEP_OF[status];
  return step === undefined ? null : Math.round(((step + 1) / STEPS.length) * 100);
}

export default function ClientPage() {
  const { data, error, loading, reload } = useApiQuery<Parcel[]>("/parcels");
  const parcels = useMemo(() => data ?? [], [data]);
  const inTransit = parcels.filter((p) =>
    ["A_ENLEVER", "ENLEVES", "AU_DEPOT", "EN_COURS", "A_VERIFIER"].includes(
      p.status,
    ),
  ).length;
  const delivered = parcels.filter(
    (p) => p.status === "LIVRES" || p.status === "LIVRES_PAYES",
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DashboardHero
        subtitle="Suivez vos colis et contactez le support si besoin."
        actions={[
          { href: "/client/tickets", label: "Support" },
          { href: "/track", label: "Suivre un code", primary: true },
        ]}
      />

      {error ? (
        <ErrorBanner message={error} onRetry={() => void reload()} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Colis"
          value={parcels.length}
          icon={PackageSearch}
          tone="brand"
        />
        <StatCard label="En route" value={inTransit} tone="gold" />
        <StatCard label="Livrés" value={delivered} tone="success" />
      </div>

      {loading && parcels.length === 0 ? (
        <LoadingBlock rows={2} label="Chargement…" />
      ) : null}

      {!loading && parcels.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Aucune livraison"
          description="Vos colis apparaîtront ici dès qu'un envoi vous est destiné."
          action={
            <Link href="/track" className={buttonClass("secondary")}>
              Suivre un code
            </Link>
          }
        />
      ) : null}

      <ul className="space-y-3">
        {parcels.map((p) => {
          const pct = progress(p.status);
          return (
            <li key={p.id}>
              <Panel className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:text-left">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-brand">
                      {p.code}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-ink">
                      {p.designation ?? p.notes ?? "Colis"}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {p.city}, {p.governorate} · {formatTnd(p.price)} à payer
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {pct !== null ? (
                  <div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-cream-soft"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                      <span>Créé</span>
                      <span>Enlevé</span>
                      <span>Dépôt</span>
                      <span>En route</span>
                      <span>Livré</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-col items-center gap-2 border-t border-cream pt-3 text-center sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left">
                  <p className="text-xs text-ink-muted">
                    Mis à jour le{" "}
                    {new Date(p.updatedAt ?? p.createdAt).toLocaleDateString(
                      "fr-TN",
                    )}
                  </p>
                  <Link
                    href={`/track?code=${encodeURIComponent(p.code ?? "")}`}
                    className={buttonClass("primary", "sm")}
                  >
                    Voir le suivi
                  </Link>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-center">
        <Link href="/client/tickets" className={buttonClass("secondary")}>
          <LifeBuoy className="h-4 w-4" aria-hidden />
          Ouvrir un ticket
        </Link>
      </div>

      <DashboardPromo />
    </div>
  );
}
