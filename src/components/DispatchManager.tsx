"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import { PlacesSmartView } from "@/components/PlacesSmartView";
import { canSeeDeliveryMode } from "@/lib/roles";

type ParcelRow = {
  id: number;
  code: string | null;
  recipientName: string;
  city: string;
  governorate?: string;
  status: string;
  mode: "EXTERNAL" | "INTERNAL";
  driver?: { id: number; name: string } | null;
  zone?: { id: number; name: string } | null;
};

type Driver = { id: number; name: string; email: string };
type Zone = { id: number; name: string; isActive: boolean };

const LIVREUR_STATUSES: StatusKey[] = [
  "A_ENLEVER",
  "ENLEVES",
  "EN_COURS",
  "LIVRES",
  "A_VERIFIER",
  "RETOUR_DEPOT",
];

export function DispatchManager({
  staffMode = false,
}: {
  staffMode?: boolean;
}) {
  const { session } = useAuth();
  const showModes = canSeeDeliveryMode(session?.user.role);
  const [parcels, setParcels] = useState<ParcelRow[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [byPlaces, setByPlaces] = useState(false);

  async function load() {
    if (!session?.accessToken) return;
    const cols = await apiFetch<ParcelRow[]>("/parcels", {
      token: session.accessToken,
    });
    setParcels(
      cols.map((p) => ({
        ...p,
        governorate: p.governorate ?? p.city,
      })),
    );
    if (staffMode) {
      const [livs, zs] = await Promise.all([
        apiFetch<Driver[]>("/users/livreurs", { token: session.accessToken }),
        apiFetch<Zone[]>("/zones", { token: session.accessToken }),
      ]);
      setDrivers(livs);
      setZones(zs.filter((z) => z.isActive));
    }
  }

  useEffect(() => {
    load().catch((e: Error) => setMessage(e.message));
  }, [session]);

  async function assign(parcelId: number, driverId: number) {
    if (!session?.accessToken) return;
    await apiFetch(`/parcels/${parcelId}/assign`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ driverId }),
    });
    setMessage(`Colis #${parcelId} assigné`);
    await load();
  }

  async function assignPlace(items: ParcelRow[], driverId: number) {
    if (!session?.accessToken || !driverId) return;
    const internal = items.filter((p) => p.mode === "INTERNAL");
    for (const p of internal) {
      await apiFetch(`/parcels/${p.id}/assign`, {
        method: "PATCH",
        token: session.accessToken,
        body: JSON.stringify({ driverId }),
      });
    }
    setMessage(
      `${internal.length} colis du lieu assignés au livreur #${driverId}`,
    );
    await load();
  }

  async function setStatus(parcelId: number, status: string) {
    if (!session?.accessToken) return;
    await apiFetch(`/parcels/${parcelId}/status`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ status }),
    });
    setMessage(`Statut mis à jour`);
    await load();
  }

  async function syncExternal() {
    if (!session?.accessToken) return;
    setSyncing(true);
    try {
      const res = await apiFetch<{ checked: number; updated: number }>(
        "/parcels/sync-external",
        { method: "POST", token: session.accessToken },
      );
      setMessage(`Sync Navex: ${res.updated}/${res.checked} mis à jour`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const internal = parcels.filter((p) => p.mode === "INTERNAL");
  const placeReady = useMemo(
    () =>
      parcels.map((p) => ({
        ...p,
        governorate: p.governorate ?? "Tunisie",
      })),
    [parcels],
  );

  function rowControls(p: ParcelRow) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {staffMode && p.mode === "INTERNAL" ? (
          <select
            className="rounded-lg border border-cream px-2 py-1.5 text-xs"
            defaultValue=""
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id)
                assign(p.id, id).catch((err: Error) => setMessage(err.message));
            }}
          >
            <option value="">Livreur…</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        ) : null}
        <select
          className="rounded-lg border border-cream px-2 py-1.5 text-xs"
          value={p.status}
          onChange={(e) =>
            setStatus(p.id, e.target.value).catch((err: Error) =>
              setMessage(err.message),
            )
          }
        >
          {(staffMode
            ? (Object.keys(STATUS_META) as StatusKey[])
            : LIVREUR_STATUSES
          ).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {staffMode ? "Dispatch" : "Mes tournées"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {staffMode
              ? showModes
                ? "Assigner par lieux · sync EXTERNAL · statuts"
                : "Assigner par lieux · sync Navex · statuts"
              : "Mettre à jour le statut de vos colis"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setByPlaces((v) => !v)}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${
              byPlaces
                ? "border border-cream bg-surface text-ink"
                : "bg-brand text-white hover:bg-brand-soft"
            }`}
          >
            {byPlaces ? "📋 Table" : "📍 Par lieux"}
          </button>
          {staffMode ? (
            <button
              type="button"
              disabled={syncing}
              onClick={() => syncExternal().catch(() => undefined)}
              className="rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {syncing ? "Sync…" : showModes ? "Sync Navex EXTERNAL" : "Sync Navex"}
            </button>
          ) : null}
        </div>
      </header>

      {message ? <p className="text-sm font-medium text-gold">{message}</p> : null}

      {byPlaces ? (
        <PlacesSmartView
          items={placeReady}
          title="Dispatch par lieux"
          description="Assignez un livreur à tout un quartier / ville d’un clic"
          renderPlaceActions={
            staffMode
              ? (_label, items) => (
                  <select
                    className="rounded-lg border-0 bg-white/95 px-2 py-1.5 text-xs font-semibold text-ink"
                    defaultValue=""
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      if (id)
                        assignPlace(items, id).catch((err: Error) =>
                          setMessage(err.message),
                        );
                    }}
                  >
                    <option value="">Assigner le lieu…</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )
              : undefined
          }
          renderItem={(p) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream bg-surface px-4 py-3">
              <div>
                <p className="font-semibold text-ink">{p.code}</p>
                <p className="text-sm text-ink-muted">
                  {p.recipientName} ·{" "}
                  {STATUS_META[p.status as StatusKey]?.label ?? p.status}
                </p>
                {p.driver ? (
                  <p className="text-xs text-brand">Livreur: {p.driver.name}</p>
                ) : null}
              </div>
              {rowControls(p)}
            </div>
          )}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-cream bg-surface shadow-soft">
          <table className="min-w-full text-sm">
            <thead className="bg-cream-soft/70 text-left text-[11px] uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Destinataire</th>
                <th className="px-4 py-3">Statut</th>
                {staffMode ? <th className="px-4 py-3">Assigner</th> : null}
                <th className="px-4 py-3">Statut →</th>
              </tr>
            </thead>
            <tbody>
              {parcels.map((p) => (
                <tr key={p.id} className="border-t border-cream-soft">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{p.code}</p>
                    {showModes ? (
                      <p className="text-[11px] text-ink-muted">{p.mode}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.recipientName}</p>
                    <p className="text-xs text-ink-muted">{p.city}</p>
                    {p.driver ? (
                      <p className="text-xs text-gold">Livreur: {p.driver.name}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {STATUS_META[p.status as StatusKey]?.label ?? p.status}
                  </td>
                  {staffMode ? (
                    <td className="px-4 py-3">
                      {p.mode === "INTERNAL" ? (
                        <select
                          className="rounded-lg border border-cream-soft px-2 py-1.5 text-xs"
                          defaultValue=""
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            if (id)
                              assign(p.id, id).catch((err: Error) =>
                                setMessage(err.message),
                              );
                          }}
                        >
                          <option value="">Livreur…</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-ink-muted">
                          {showModes ? "EXTERNAL" : "Réseau"}
                        </span>
                      )}
                    </td>
                  ) : null}
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-cream-soft px-2 py-1.5 text-xs"
                      value={p.status}
                      onChange={(e) =>
                        setStatus(p.id, e.target.value).catch((err: Error) =>
                          setMessage(err.message),
                        )
                      }
                    >
                      {(staffMode
                        ? (Object.keys(STATUS_META) as StatusKey[])
                        : LIVREUR_STATUSES
                      ).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {parcels.length === 0 ? (
                <tr>
                  <td
                    colSpan={staffMode ? 5 : 4}
                    className="px-4 py-8 text-center text-ink-muted"
                  >
                    Aucun colis
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {staffMode && zones.length > 0 ? (
        <p className="text-xs text-ink-muted">
          Zones actives: {zones.map((z) => z.name).join(", ")}
          {showModes ? ` · ${internal.length} colis INTERNAL` : ""}
        </p>
      ) : null}
    </div>
  );
}
