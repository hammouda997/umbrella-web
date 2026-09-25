"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  AddressLocationFields,
  type AddressLocationValue,
} from "@/components/AddressLocationFields";
import { PageHeader, Panel } from "@/components/ui";
import {
  loadAddressBook,
  removeAddress,
  upsertAddress,
  type SavedAddress,
} from "@/lib/address-book";
import { displayGovernorate } from "@/lib/normalize-text";

const EMPTY_LOCATION: AddressLocationValue = {
  governorate: "",
  city: "",
  locality: "",
  address: "",
  lat: null,
  lng: null,
  accuracyMeters: null,
};

export default function ExpediteurAdressesPage() {
  const [list, setList] = useState<SavedAddress[]>([]);
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<AddressLocationValue>(EMPTY_LOCATION);

  useEffect(() => {
    setList(loadAddressBook());
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carnet d'adresses"
        description="Réutilisez des adresses fréquentes à la création de colis"
        actions={
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              setLocation(EMPTY_LOCATION);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        }
      />

      {open ? (
        <Panel>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!location.governorate || !location.city || !location.address) {
                return;
              }
              const fd = new FormData(e.currentTarget);
              const next = upsertAddress({
                id: `addr-${Date.now()}`,
                label: String(fd.get("label") || "Adresse"),
                contact: String(fd.get("contact") || ""),
                phone: String(fd.get("phone") || ""),
                line: location.locality
                  ? `${location.locality}, ${location.address}`
                  : location.address,
                city: location.city,
                governorate: location.governorate,
                locality: location.locality,
                lat: location.lat,
                lng: location.lng,
              });
              setList(next);
              setOpen(false);
              setLocation(EMPTY_LOCATION);
              e.currentTarget.reset();
            }}
          >
            {(
              [
                ["label", "Libellé"],
                ["contact", "Contact"],
                ["phone", "Téléphone"],
              ] as const
            ).map(([name, label]) => (
              <label key={name} className="block text-sm sm:col-span-1">
                <span className="text-ink-muted">{label}</span>
                <input
                  name={name}
                  required
                  className="mt-1 w-full rounded-xl border border-cream-soft px-3 py-2 outline-none ring-brand focus:ring-2"
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <AddressLocationFields
                value={location}
                onChange={setLocation}
                required
                fieldClass="mt-1 w-full rounded-xl border border-cream-soft px-3 py-2 outline-none ring-brand focus:ring-2"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((a) => (
          <li key={a.id}>
            <Panel className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{a.label}</p>
                <p className="mt-1 text-sm text-ink">{a.contact}</p>
                <p className="text-sm text-ink-muted">{a.phone}</p>
                <p className="mt-2 text-sm text-ink-muted">
                  {a.line}, {a.city}
                  {a.governorate
                    ? ` · ${displayGovernorate(a.governorate)}`
                    : ""}
                </p>
                {a.lat != null && a.lng != null ? (
                  <p className="mt-1 font-mono text-[10px] text-ink-muted">
                    {a.lat.toFixed(5)}, {a.lng.toFixed(5)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setList(removeAddress(a.id))}
                className="h-9 w-9 shrink-0 rounded-lg border border-cream text-ink-muted hover:text-brand"
                aria-label="Supprimer"
              >
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
}
