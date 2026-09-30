"use client";

import { useEffect, useState } from "react";
import { Check, MapPinned, Pencil, Plus, X } from "lucide-react";
import { useToast } from "@/components/Feedback";
import { cn } from "@/lib/cn";
import {
  loadZoneBook,
  upsertZone,
  type SavedZone,
} from "@/lib/zone-book";

type ZoneFieldProps = {
  value: string | null;
  onChange: (zoneName: string | null) => void;
  canManage?: boolean;
  fieldClass?: string;
};

export function ZoneField({
  value,
  onChange,
  canManage = true,
  fieldClass =
    "w-full rounded-xl border border-cream-soft bg-surface px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2",
}: ZoneFieldProps) {
  const toast = useToast();
  const [zones, setZones] = useState<SavedZone[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const list = loadZoneBook();
    if (
      value &&
      !list.some(
        (z) => z.name.localeCompare(value, "fr", { sensitivity: "base" }) === 0,
      )
    ) {
      setZones(upsertZone({ name: value }));
      return;
    }
    setZones(list);
  }, [value]);

  function refresh(next: SavedZone[]) {
    setZones(next);
  }

  function addZone() {
    const name = newName.trim();
    if (name.length < 2) {
      toast.error("Nom trop court", "Au moins 2 caractères (ex. Zone A).");
      return;
    }
    const next = upsertZone({ name });
    refresh(next);
    onChange(name);
    setNewName("");
    setCreating(false);
    toast.success("Zone ajoutée", name);
  }

  function saveEdit() {
    if (!editingId) return;
    const name = editName.trim();
    if (name.length < 2) {
      toast.error("Nom trop court", "Au moins 2 caractères.");
      return;
    }
    const prev = zones.find((z) => z.id === editingId);
    const next = upsertZone({ id: editingId, name });
    refresh(next);
    if (value && prev && value.localeCompare(prev.name, "fr", { sensitivity: "base" }) === 0) {
      onChange(name);
    }
    setEditingId(null);
    setEditName("");
    toast.success("Zone modifiée", name);
  }

  return (
    <div className="space-y-2">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
        <MapPinned className="h-3.5 w-3.5" />
        Zones
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition",
            value == null
              ? "border-brand bg-brand/10 text-brand"
              : "border-cream bg-surface text-ink-muted hover:border-brand hover:text-brand",
          )}
        >
          Sans zone
        </button>
        {zones.map((zone) => {
          const selected =
            value != null &&
            value.localeCompare(zone.name, "fr", { sensitivity: "base" }) === 0;
          return (
            <div key={zone.id} className="inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onChange(zone.name)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition",
                  selected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-cream bg-surface text-ink hover:border-brand hover:text-brand",
                )}
              >
                {zone.name}
              </button>
              {canManage ? (
                <button
                  type="button"
                  title={`Modifier ${zone.name}`}
                  aria-label={`Modifier ${zone.name}`}
                  onClick={() => {
                    setCreating(false);
                    setEditingId(zone.id);
                    setEditName(zone.name);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream-soft hover:text-brand"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          );
        })}
        {canManage ? (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setCreating(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-cream-soft px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:border-brand hover:text-brand"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter une zone
          </button>
        ) : null}
      </div>

      {creating ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex. Zone A"
            maxLength={80}
            className={fieldClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addZone();
              }
              if (e.key === "Escape") setCreating(false);
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addZone}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" />
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cream text-ink-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {editingId ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={80}
            className={fieldClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveEdit();
              }
              if (e.key === "Escape") setEditingId(null);
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" />
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cream text-ink-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
