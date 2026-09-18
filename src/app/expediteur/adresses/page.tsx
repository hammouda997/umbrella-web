"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";

type Address = {
  id: string;
  label: string;
  contact: string;
  phone: string;
  line: string;
  city: string;
};

const SEED: Address[] = [
  {
    id: "1",
    label: "Entrepôt principal",
    contact: "Demo Expéditeur",
    phone: "21000000",
    line: "Zone industrielle Charguia",
    city: "Ariana",
  },
  {
    id: "2",
    label: "Point relais client VIP",
    contact: "Amira Trabelsi",
    phone: "98765432",
    line: "Avenue Habib Bourguiba",
    city: "Ezzahra",
  },
];

export default function ExpediteurAdressesPage() {
  const [list, setList] = useState(SEED);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carnet d'adresses"
        description="Réutilisez des adresses fréquentes à la création de colis"
        actions={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
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
              const fd = new FormData(e.currentTarget);
              setList((prev) => [
                {
                  id: String(Date.now()),
                  label: String(fd.get("label") || "Adresse"),
                  contact: String(fd.get("contact") || ""),
                  phone: String(fd.get("phone") || ""),
                  line: String(fd.get("line") || ""),
                  city: String(fd.get("city") || ""),
                },
                ...prev,
              ]);
              setOpen(false);
              e.currentTarget.reset();
            }}
          >
            {(
              [
                ["label", "Libellé"],
                ["contact", "Contact"],
                ["phone", "Téléphone"],
                ["line", "Adresse"],
                ["city", "Ville"],
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
                </p>
              </div>
              <button
                type="button"
                aria-label="Supprimer"
                onClick={() => setList((p) => p.filter((x) => x.id !== a.id))}
                className="h-9 w-9 shrink-0 rounded-lg border border-cream text-ink-muted hover:text-brand"
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
