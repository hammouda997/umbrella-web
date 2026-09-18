"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Panel } from "@/components/ui";

export default function ExpediteurSettingsPage() {
  const { session } = useAuth();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Profil & paramètres"
        description="Coordonnées de votre compte expéditeur"
      />
      <Panel>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-ink">Nom</span>
            <input
              name="name"
              defaultValue={session?.user.name ?? ""}
              className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Email</span>
            <input
              name="email"
              type="email"
              defaultValue={session?.user.email ?? ""}
              className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Téléphone</span>
            <input
              name="phone"
              defaultValue={session?.user.phone ?? ""}
              className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Notifications email</span>
            <select
              name="notif"
              defaultValue="all"
              className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none ring-brand focus:ring-2"
            >
              <option value="all">Tous les événements</option>
              <option value="deliver">Livraisons uniquement</option>
              <option value="off">Désactivées</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            Enregistrer
          </button>
          {saved ? (
            <p className="text-sm text-emerald-700">Modifications enregistrées (démo)</p>
          ) : null}
        </form>
      </Panel>
    </div>
  );
}
