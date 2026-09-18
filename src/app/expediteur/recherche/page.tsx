"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import { EmptyState, LoadingBlock, PageHeader, Panel } from "@/components/ui";
import type { DetailParcel } from "@/components/ParcelDetailTable";

const STATUS_OPTIONS = Object.keys(STATUS_META) as StatusKey[];

export default function ExpediteurRecherchePage() {
  const { session } = useAuth();
  const [parcels, setParcels] = useState<DetailParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<DetailParcel[]>("/parcels", { token: session.accessToken })
      .then(setParcels)
      .finally(() => setLoading(false));
  }, [session]);

  const cities = useMemo(
    () => Array.from(new Set(parcels.map((p) => p.city))).sort(),
    [parcels],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return parcels.filter((p) => {
      if (status && p.status !== status) return false;
      if (city && p.city !== city) return false;
      if (!needle) return true;
      const blob = [
        p.code,
        p.recipientName,
        p.phone,
        p.address,
        p.city,
        p.notes,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [parcels, q, status, city]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rechercher un colis"
        description="Filtres par code, destinataire, statut et ville"
      />

      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-ink-muted">Recherche</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Code, nom, téléphone…"
              className="mt-1 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted">Statut</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            >
              <option value="">Tous</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted">Ville</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            >
              <option value="">Toutes</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      {loading ? <LoadingBlock /> : null}

      {!loading && filtered.length === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Élargissez vos filtres ou créez un nouveau colis."
        />
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-cream bg-surface shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-soft/60 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Destinataire</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Prix</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-cream-soft hover:bg-brand/[0.03]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/expediteur/parcels/${p.id}`}
                      className="font-semibold text-brand hover:underline"
                    >
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.recipientName}</p>
                    <p className="text-xs text-ink-muted">{p.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {STATUS_META[p.status as StatusKey]?.label ?? p.status}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{p.city}</td>
                  <td className="px-4 py-3 font-medium">{p.price} TND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
