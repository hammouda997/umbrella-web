"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui";

type Zone = {
  id: number;
  name: string;
  governorate: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
};

export function ZonesManager({ canCreate = true }: { canCreate?: boolean }) {
  const { session } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);

  async function load() {
    if (!session?.accessToken) return;
    setZones(await apiFetch<Zone[]>("/zones", { token: session.accessToken }));
  }

  useEffect(() => {
    load().catch(console.error);
  }, [session]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken) return;
    const form = new FormData(e.currentTarget);
    await apiFetch("/zones", {
      method: "POST",
      token: session.accessToken,
      body: JSON.stringify({
        name: form.get("name"),
        governorate: form.get("governorate") || undefined,
        centerLat: Number(form.get("centerLat")),
        centerLng: Number(form.get("centerLng")),
        radiusKm: Number(form.get("radiusKm")),
      }),
    });
    e.currentTarget.reset();
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zones"
        description="Zones de livraison et géolocalisation flotte"
      />

      {canCreate ? (
        <form
          onSubmit={onCreate}
          className="grid gap-3 rounded-2xl border border-cream bg-surface/80 p-5 shadow-soft md:grid-cols-2"
        >
          <input name="name" required placeholder="Nom zone" className="rounded-xl border border-cream-soft px-3 py-2" />
          <input name="governorate" placeholder="Gouvernorat" className="rounded-xl border border-cream-soft px-3 py-2" />
          <input name="centerLat" required type="number" step="any" placeholder="Latitude" className="rounded-xl border border-cream-soft px-3 py-2" />
          <input name="centerLng" required type="number" step="any" placeholder="Longitude" className="rounded-xl border border-cream-soft px-3 py-2" />
          <input name="radiusKm" required type="number" step="any" placeholder="Rayon km" className="rounded-xl border border-cream-soft px-3 py-2" />
          <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
            Ajouter la zone
          </button>
        </form>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {zones.map((z) => (
          <article
            key={z.id}
            className="rounded-2xl border border-cream bg-surface/80 p-5 shadow-soft"
          >
            <h2 className="font-display text-xl text-brand">{z.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">{z.governorate ?? "—"}</p>
            <p className="mt-3 text-sm text-ink">
              {z.centerLat}, {z.centerLng} · {z.radiusKm} km
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
