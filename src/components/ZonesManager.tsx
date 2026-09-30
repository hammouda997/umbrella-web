"use client";

import dynamic from "next/dynamic";
import { FormEvent, useMemo, useState } from "react";
import { MapPinned, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { errorText, useConfirm, useToast } from "@/components/Feedback";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
  SelectField,
  TextField,
} from "@/components/ui";
import type { Zone } from "@/lib/domain";
import { TUNISIA_GOVERNORATES } from "@/lib/status-meta";
import { useApi, useApiQuery } from "@/lib/use-api";

const MapPinPicker = dynamic(
  () => import("@/components/MapPinPicker").then((m) => m.MapPinPicker),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-cream-soft/60" /> },
);

type Draft = {
  id: number | null;
  name: string;
  governorate: string;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
};

const EMPTY_DRAFT: Draft = { id: null, name: "", governorate: "", lat: null, lng: null, radiusKm: 20 };

export function ZonesManager({ canCreate = true }: { canCreate?: boolean }) {
  const request = useApi();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApiQuery<Zone[]>("/zones");
  const zones = useMemo(() => data ?? [], [data]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  function openEdit(zone: Zone) {
    setDraft({
      id: zone.id,
      name: zone.name,
      governorate: zone.governorate ?? "",
      lat: zone.centerLat,
      lng: zone.centerLng,
      radiusKm: zone.radiusKm ?? 20,
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const body = {
      name: draft.name.trim(),
      governorate: draft.governorate || undefined,
      centerLat: draft.lat ?? undefined,
      centerLng: draft.lng ?? undefined,
      radiusKm: draft.radiusKm || undefined,
    };
    setSaving(true);
    try {
      if (draft.id) await request(`/zones/${draft.id}`, "PATCH", body);
      else await request("/zones", "POST", body);
      toast.success(draft.id ? "Zone mise à jour" : "Zone créée", body.name);
      setDraft(null);
      await reload();
    } catch (err) {
      toast.error("Enregistrement impossible", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(zone: Zone) {
    setBusyId(zone.id);
    try {
      await request(`/zones/${zone.id}`, "PATCH", { isActive: !zone.isActive });
      toast.success(zone.isActive ? "Zone désactivée" : "Zone activée", zone.name);
      await reload();
    } catch (err) {
      toast.error("Action impossible", errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(zone: Zone) {
    const ok = await confirm({
      title: `Supprimer la zone « ${zone.name} » ?`,
      description: zone.parcelCount
        ? `${zone.parcelCount} colis seront détachés de cette zone.`
        : "Aucun colis n'est rattaché à cette zone.",
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(zone.id);
    try {
      await request(`/zones/${zone.id}`, "DELETE");
      toast.success("Zone supprimée", zone.name);
      await reload();
    } catch (err) {
      toast.error("Suppression impossible", errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zones de livraison"
        description={`${zones.filter((z) => z.isActive).length} zone(s) active(s) · rayon et centre utilisés pour la flotte interne`}
        actions={
          canCreate ? (
            <Button icon={Plus} onClick={() => setDraft(EMPTY_DRAFT)}>
              Nouvelle zone
            </Button>
          ) : undefined
        }
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}
      {loading && zones.length === 0 ? <LoadingBlock rows={3} /> : null}

      {!loading && zones.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="Aucune zone"
          description="Créez une zone pour organiser la flotte interne."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zones.map((z) => (
          <Panel key={z.id} className={z.isActive ? "" : "opacity-70"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-bold text-ink">{z.name}</h2>
                <p className="text-sm text-ink-muted">{z.governorate ?? "Gouvernorat non défini"}</p>
              </div>
              <Badge tone={z.isActive ? "success" : "neutral"} dot>
                {z.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Rayon</dt>
                <dd className="font-semibold text-ink">{z.radiusKm ?? "—"} km</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Colis</dt>
                <dd className="font-semibold text-ink">{z.parcelCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Centre</dt>
                <dd className="truncate font-mono text-xs text-ink">
                  {z.centerLat != null && z.centerLng != null
                    ? `${z.centerLat.toFixed(3)}, ${z.centerLng.toFixed(3)}`
                    : "—"}
                </dd>
              </div>
            </dl>
            {canCreate ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-cream pt-4">
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(z)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Power}
                  loading={busyId === z.id}
                  onClick={() => void toggleActive(z)}
                >
                  {z.isActive ? "Désactiver" : "Activer"}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  disabled={busyId === z.id}
                  onClick={() => void remove(z)}
                >
                  Supprimer
                </Button>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Modifier la zone" : "Nouvelle zone"}
        description="Nommez la zone (ex. Zone A). Carte optionnelle pour le rayon."
        size="lg"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setDraft(null)}>
              Annuler
            </Button>
            <Button type="submit" form="zone-form" loading={saving}>
              Enregistrer
            </Button>
          </div>
        }
      >
        {draft ? (
          <form id="zone-form" onSubmit={onSave} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="Nom"
                required
                minLength={2}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                wrapperClassName="sm:col-span-2"
              />
              <TextField
                label="Rayon (km)"
                type="number"
                min={1}
                max={500}
                step={1}
                value={draft.radiusKm}
                onChange={(e) => setDraft({ ...draft, radiusKm: Number(e.target.value) })}
              />
            </div>
            <SelectField
              label="Gouvernorat"
              value={draft.governorate}
              onChange={(e) => setDraft({ ...draft, governorate: e.target.value })}
            >
              <option value="">Non défini</option>
              {TUNISIA_GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </SelectField>
            <MapPinPicker
              lat={draft.lat}
              lng={draft.lng}
              onPick={({ lat, lng }) => setDraft((d) => (d ? { ...d, lat, lng } : d))}
            />
            <p className="text-xs text-ink-muted">
              Centre (optionnel) :{" "}
              {draft.lat != null && draft.lng != null
                ? `${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}`
                : "non défini — zone nominale uniquement"}
            </p>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
