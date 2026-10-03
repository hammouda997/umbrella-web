"use client";

import { useEffect, useState } from "react";
import {
  DashboardHero,
  DashboardPromo,
} from "@/components/DashboardHero";
import { StatusBoard } from "@/components/StatusBoard";
import { apiFetch, type StatusCard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function DashboardHome({
  basePath,
  title = "Tableau de bord",
  description = "Cliquez une carte pour ouvrir les colis de ce statut.",
}: {
  basePath: string;
  title?: string;
  description?: string;
}) {
  const { session } = useAuth();
  const [items, setItems] = useState<StatusCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    apiFetch<StatusCard[]>("/dashboard/status-counts", {
      token: session.accessToken,
    })
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <DashboardHero
        subtitle={description}
        actions={[
          {
            href: `${basePath}/parcels`,
            label: "Tous les colis",
            primary: true,
          },
        ]}
        footer={
          <div className="mx-auto flex max-w-xs flex-col items-center gap-1 rounded-lg border border-ops-card bg-ops-surface px-4 py-2 text-center lg:mx-0 lg:items-start lg:text-left">
            <p className="text-[11px] uppercase tracking-wide text-ops-ink/50">
              {title} · Total
            </p>
            <p className="font-display text-xl font-bold text-ops-accent">{total}</p>
          </div>
        }
      />

      {loading ? (
        <div className="rounded-2xl border border-ops-card bg-ops-surface p-1.5">
          <div className="grid grid-cols-3 gap-1 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-ops-surface-2/80 md:h-11"
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-ops-accent/20 bg-ops-accent/10 px-4 py-3 text-center text-sm text-ops-accent lg:text-left">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <StatusBoard items={items} basePath={basePath} />
      ) : null}

      <DashboardPromo />
    </div>
  );
}
