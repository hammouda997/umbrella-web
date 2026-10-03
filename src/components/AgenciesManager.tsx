"use client";

import { FormEvent, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Power, Trash2 } from "lucide-react";
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
  TextField,
} from "@/components/ui";
import type { Agency } from "@/lib/domain";
import { TUNISIA_GOVERNORATES } from "@/lib/status-meta";
import { useApi, useApiQuery } from "@/lib/use-api";

type Draft = {
  id: number | null;
  name: string;
  governorate: string;
};

const EMPTY: Draft = { id: null, name: "", governorate: "Tunis" };

export function AgenciesManager() {
  const request = useApi();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApiQuery<Agency[]>("/agencies");
  const agencies = useMemo(() => data ?? [], [data]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const body = {
      name: draft.name.trim(),
      governorate: draft.governorate.trim(),
    };
    setSaving(true);
    try {
      if (draft.id) await request(`/agencies/${draft.id}`, "PATCH", body);
      else await request("/agencies", "POST", body);
      toast.success(draft.id ? "Agence mise à jour" : "Agence créée", body.name);
      setDraft(null);
      await reload();
    } catch (err) {
      toast.error("Enregistrement impossible", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(agency: Agency) {
    setBusyId(agency.id);
    try {
      await request(`/agencies/${agency.id}`, "PATCH", {
        isActive: !agency.isActive,
      });
      toast.success(
        agency.isActive ? "Agence désactivée" : "Agence activée",
        agency.name,
      );
      await reload();
    } catch (err) {
      toast.error("Action impossible", errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(agency: Agency) {
    const ok = await confirm({
      title: `Supprimer « ${agency.name} » ?`,
      description: "Les utilisateurs et colis seront détachés de cette agence.",
      confirmLabel: "Supprimer",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(agency.id);
    try {
      await request(`/agencies/${agency.id}`, "DELETE");
      toast.success("Agence supprimée", agency.name);
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
        title="Agences (gouvernorat)"
        description="Scopes chef d’agence, support, pickup et magasinier — distinct des zones livreur."
        actions={
          <Button icon={Plus} onClick={() => setDraft(EMPTY)}>
            Nouvelle agence
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}
      {loading && agencies.length === 0 ? <LoadingBlock rows={3} /> : null}

      {!loading && agencies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune agence"
          description="Créez une agence par gouvernorat pour rattacher le staff."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agencies.map((agency) => (
          <Panel key={agency.id} className={agency.isActive ? "" : "opacity-70"}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ops-ink">
                  {agency.name}
                </h2>
                <p className="text-sm text-ops-ink/50">{agency.governorate}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{agency.userCount ?? 0} users</Badge>
                  <Badge>{agency.parcelCount ?? 0} colis</Badge>
                  {!agency.isActive ? (
                    <Badge tone="warning">Inactive</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Pencil}
                  aria-label="Modifier"
                  onClick={() =>
                    setDraft({
                      id: agency.id,
                      name: agency.name,
                      governorate: agency.governorate,
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Power}
                  aria-label="Activer"
                  disabled={busyId === agency.id}
                  onClick={() => void toggleActive(agency)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  aria-label="Supprimer"
                  disabled={busyId === agency.id}
                  onClick={() => void remove(agency)}
                />
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Modifier l’agence" : "Nouvelle agence"}
      >
        {draft ? (
          <form className="space-y-4" onSubmit={(e) => void onSave(e)}>
            <TextField
              label="Nom"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
              required
              minLength={2}
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ops-ink">
              Gouvernorat
              <select
                className="w-full rounded-xl border border-ops-card bg-ops-surface px-3 py-2.5 text-sm"
                value={draft.governorate}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev ? { ...prev, governorate: e.target.value } : prev,
                  )
                }
              >
                {TUNISIA_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
