"use client";

import { useMemo, useState } from "react";
import { MOCK_PARCELS, MOCK_USERS } from "@/lib/mock-data";
import { PageHeader, Panel } from "@/components/ui";

export default function CaissierPage() {
  const delivered = useMemo(
    () =>
      MOCK_PARCELS.filter((p) =>
        ["LIVRES", "LIVRES_PAYES"].includes(p.status),
      ),
    [],
  );
  const [settled, setSettled] = useState<Record<number, boolean>>({});
  const drivers = MOCK_USERS.filter((u) => u.role === "LIVREUR");

  const totalOpen = delivered
    .filter((p) => !settled[p.id])
    .reduce((s, p) => s + p.price, 0);
  const totalSettled = delivered
    .filter((p) => settled[p.id])
    .reduce((s, p) => s + p.price, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caisse COD"
        description="Règlement des montants encaissés par les livreurs (démo)"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel>
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            À régler
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-brand">
            {totalOpen.toFixed(2)} TND
          </p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Réglé aujourd&apos;hui
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {totalSettled.toFixed(2)} TND
          </p>
        </Panel>
        <Panel>
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Livreurs actifs
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {drivers.length}
          </p>
        </Panel>
      </div>

      <Panel className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-soft/60 text-left text-[11px] uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Colis</th>
              <th className="px-4 py-3">Livreur</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {delivered.map((p) => {
              const done = Boolean(settled[p.id]);
              return (
                <tr key={p.id} className="border-t border-cream-soft">
                  <td className="px-4 py-3 font-semibold text-ink">{p.code}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {p.driver?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">{p.price} TND</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        done
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {done ? "Réglé" : "En attente"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={done}
                      onClick={() =>
                        setSettled((s) => ({ ...s, [p.id]: true }))
                      }
                      className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      Encaisser
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
