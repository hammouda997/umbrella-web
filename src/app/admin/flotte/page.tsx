"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MOCK_PARCELS } from "@/lib/mock-data";
import { PageHeader, Panel, LoadingBlock } from "@/components/ui";

type Driver = { id: number; name: string; email: string };

export default function FlottePage() {
  const { session } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<Driver[]>("/users/livreurs", { token: session.accessToken })
      .then(setDrivers)
      .finally(() => setLoading(false));
  }, [session]);

  if (loading) return <LoadingBlock label="Chargement flotte…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flotte livreurs"
        description="Affectations et charge du jour"
      />
      <div className="grid gap-4 md:grid-cols-2">
        {drivers.map((d) => {
          const assigned = MOCK_PARCELS.filter((p) => p.driverId === d.id);
          const active = assigned.filter((p) =>
            ["EN_COURS", "A_ENLEVER", "ENLEVES", "AU_DEPOT"].includes(p.status),
          );
          return (
            <Panel key={d.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-ink">
                    {d.name}
                  </p>
                  <p className="text-sm text-ink-muted">{d.email}</p>
                </div>
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                  {active.length} en cours
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {assigned.slice(0, 4).map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-t border-cream-soft pt-2"
                  >
                    <span className="font-medium text-ink">{p.code}</span>
                    <span className="text-ink-muted">{p.city}</span>
                  </li>
                ))}
                {assigned.length === 0 ? (
                  <li className="text-ink-muted">Aucun colis assigné</li>
                ) : null}
              </ul>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
