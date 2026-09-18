"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cream bg-surface px-4 py-2">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">Total</p>
            <p className="font-display text-xl font-bold text-brand">{total}</p>
          </div>
          <Link
            href={`${basePath}/parcels`}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            Tous les colis
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-md bg-cream-soft/80" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-brand">
          {error}
        </p>
      ) : null}

      {!loading && !error ? <StatusBoard items={items} basePath={basePath} /> : null}
    </div>
  );
}
