"use client";

import { useMemo, useState } from "react";
import { ParcelDetailTable } from "@/components/ParcelDetailTable";
import { Button, ErrorBanner, PageHeader, Panel, SelectField } from "@/components/ui";
import type { Parcel } from "@/lib/domain";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import { useApiQuery } from "@/lib/use-api";

const STATUS_OPTIONS = Object.keys(STATUS_META) as StatusKey[];

export default function ExpediteurRecherchePage() {
  const { data, error, loading, reload } = useApiQuery<Parcel[]>("/parcels");
  const parcels = useMemo(() => data ?? [], [data]);
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [period, setPeriod] = useState("");

  const cities = useMemo(
    () => Array.from(new Set(parcels.map((p) => p.city))).sort((a, b) => a.localeCompare(b, "fr")),
    [parcels],
  );

  const filtered = useMemo(() => {
    const since = period ? Date.now() - Number(period) * 86_400_000 : 0;
    return parcels.filter(
      (p) =>
        (!status || p.status === status) &&
        (!city || p.city === city) &&
        (!since || new Date(p.createdAt).getTime() >= since),
    );
  }, [parcels, status, city, period]);

  const hasFilters = Boolean(status || city || period);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recherche avancée"
        description="Filtrez vos colis par statut, ville et période, puis exportez le résultat"
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}

      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField label="Statut" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </SelectField>
          <SelectField label="Ville" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Toutes</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <SelectField label="Période" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Tout l’historique</option>
            <option value="1">Dernières 24 h</option>
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
          </SelectField>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              disabled={!hasFilters}
              onClick={() => {
                setStatus("");
                setCity("");
                setPeriod("");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Panel>

      <ParcelDetailTable
        rows={filtered}
        loading={loading && parcels.length === 0}
        detailBasePath="/expediteur/parcels"
        reportTitle="Recherche colis"
      />
    </div>
  );
}
