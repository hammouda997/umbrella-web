"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, RefreshCw, Route } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import {
  ACTION_TONE_CLASS,
  livreurActionsFor,
  type LivreurAction,
} from "@/lib/livreur-actions";
import {
  buildTourByPlaces,
  flattenTourStops,
  googleMapsTourUrl,
} from "@/lib/tour-planner";
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui";

type TourParcel = {
  id: number;
  code: string | null;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  status: string;
  mode: "EXTERNAL" | "INTERNAL";
  price: string | number;
  notes?: string | null;
};

export function LivreurTour() {
  const { session } = useAuth();
  const [parcels, setParcels] = useState<TourParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pending, setPending] = useState<{
    parcel: TourParcel;
    action: LivreurAction;
  } | null>(null);
  const [comment, setComment] = useState("");

  async function load() {
    if (!session?.accessToken) return;
    const data = await apiFetch<TourParcel[]>("/parcels", {
      token: session.accessToken,
    });
    setParcels(data);
  }

  useEffect(() => {
    load()
      .catch((e: Error) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const active = useMemo(
    () =>
      parcels.filter(
        (p) =>
          ![
            "LIVRES",
            "LIVRES_PAYES",
            "RETOUR_EXPEDITEURS",
            "REMBOURSES",
          ].includes(p.status),
      ),
    [parcels],
  );
  const done = useMemo(
    () => parcels.filter((p) => ["LIVRES", "LIVRES_PAYES"].includes(p.status)),
    [parcels],
  );

  const places = useMemo(
    () => (tourActive ? buildTourByPlaces(active) : []),
    [tourActive, active],
  );

  const orderedStops = useMemo(() => flattenTourStops(places), [places]);

  const mapsUrl = useMemo(
    () => googleMapsTourUrl(orderedStops),
    [orderedStops],
  );

  function demandTour() {
    if (active.length === 0) {
      setMessage("Aucun colis actif à organiser");
      return;
    }
    setGenerating(true);
    setMessage(null);
    window.setTimeout(() => {
      setTourActive(true);
      const planned = buildTourByPlaces(active);
      setMessage(
        `🗺️ Tournée prête · ${planned.length} lieu(x) · ${active.length} stop(s)`,
      );
      setGenerating(false);
    }, 450);
  }

  function clearTour() {
    setTourActive(false);
    setMessage("Tournée réinitialisée — liste simple");
  }

  async function applyStatus(
    parcelId: number,
    status: string,
    note?: string,
  ) {
    if (!session?.accessToken) return;
    setBusyId(parcelId);
    setMessage(null);
    try {
      await apiFetch(`/parcels/${parcelId}/status`, {
        method: "PATCH",
        token: session.accessToken,
        body: JSON.stringify({
          status,
          comment: note || undefined,
          actor: "LIVREUR",
        }),
      });
      setMessage("Statut mis à jour");
      setPending(null);
      setComment("");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  function onAction(parcel: TourParcel, action: LivreurAction) {
    if (action.needsComment) {
      setPending({ parcel, action });
      setComment("");
      return;
    }
    void applyStatus(parcel.id, action.status);
  }

  function onConfirmComment(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    if (!comment.trim()) {
      setMessage("Un commentaire est requis pour cette action");
      return;
    }
    void applyStatus(pending.parcel.id, pending.action.status, comment.trim());
  }

  function renderParcelCard(
    p: TourParcel,
    stopIndex?: number,
  ) {
    const statusLabel =
      STATUS_META[p.status as StatusKey]?.label ?? p.status;
    const actions = livreurActionsFor(p.status);
    const busy = busyId === p.id;

    return (
      <article className="rounded-2xl border border-cream bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            {stopIndex != null ? (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand">
                Stop {stopIndex}
              </p>
            ) : null}
            <p className="font-mono text-xs font-semibold text-brand">
              {p.code}
            </p>
            <h2 className="mt-0.5 font-display text-lg font-bold text-ink">
              {p.recipientName}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted">
              <MapPin className="h-3.5 w-3.5" />
              {p.city} · {p.governorate}
            </p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{
              backgroundColor:
                STATUS_META[p.status as StatusKey]?.color ??
                "var(--color-surface-2)",
              color: STATUS_META[p.status as StatusKey]?.ink ?? "#1A1414",
            }}
          >
            {statusLabel}
          </span>
        </div>

        <p className="mt-3 text-sm text-ink-muted">{p.address}</p>
        <p className="mt-1 font-semibold text-ink">{p.price} TND COD</p>

        <div className="mt-3 flex gap-2">
          <a
            href={`tel:${p.phone}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream py-2.5 text-sm font-semibold text-ink"
          >
            <span aria-hidden>📞</span>
            Appeler
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${p.address} ${p.city} Tunisie`,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-cream py-2.5 text-sm font-semibold text-ink"
          >
            <span aria-hidden>🗺️</span>
            GPS
          </a>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => onAction(p, action)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${ACTION_TONE_CLASS[action.tone]}`}
            >
              <span aria-hidden>{action.emoji}</span>
              {action.label}
            </button>
          ))}
        </div>
      </article>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10">
      <PageHeader
        title="Ma tournée"
        description="Demandez une tournée intelligente groupée par lieux"
        actions={
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load()
                .catch((e: Error) => setMessage(e.message))
                .finally(() => setLoading(false));
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cream px-3 py-2 text-sm font-semibold text-ink"
          >
            <RefreshCw className="h-4 w-4" />
            Rafraîchir
          </button>
        }
      />

      <Panel className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-xl">
            🛵
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-ink">
              Tournée intelligente
            </p>
            <p className="text-sm text-ink-muted">
              Regroupe vos colis par ville / gouvernorat et propose un ordre de
              passage.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={generating || active.length === 0}
            onClick={demandTour}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-soft disabled:opacity-50"
          >
            <Route className="h-4 w-4" />
            {generating ? "Organisation…" : "Demander une tournée"}
          </button>
          {tourActive ? (
            <button
              type="button"
              onClick={clearTour}
              className="rounded-xl border border-cream px-4 py-3 text-sm font-semibold text-ink"
            >
              Liste simple
            </button>
          ) : null}
        </div>
        {tourActive && mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cream bg-cream-soft/50 px-4 py-2.5 text-sm font-semibold text-ink"
          >
            <span aria-hidden>🗺️</span>
            Ouvrir l&apos;itinéraire GPS ({orderedStops.length} stops)
          </a>
        ) : null}
      </Panel>

      <div className="grid grid-cols-3 gap-2">
        {[
          ["Actifs", active.length],
          ["Lieux", tourActive ? places.length : "—"],
          ["Livrés", done.length],
        ].map(([label, n]) => (
          <Panel key={String(label)} className="py-3 text-center">
            <p className="font-display text-xl font-bold text-ink">{n}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">
              {label}
            </p>
          </Panel>
        ))}
      </div>

      {message ? (
        <p className="rounded-xl border border-cream bg-surface px-4 py-2 text-sm font-medium text-ink">
          {message}
        </p>
      ) : null}

      {loading ? <LoadingBlock rows={3} label="Chargement tournée…" /> : null}

      {!loading && active.length === 0 ? (
        <EmptyState
          title="Aucune tournée active"
          description="Les colis livrés ou clôturés apparaissent dans la liste complète."
          action={
            <Link
              href="/livreur/parcels"
              className="text-sm font-semibold text-brand"
            >
              Voir tous les colis
            </Link>
          }
        />
      ) : null}

      {!loading && tourActive && places.length > 0 ? (
        <div className="space-y-6">
          {places.map((place, placeIndex) => {
            const baseIndex = places
              .slice(0, placeIndex)
              .reduce((sum, p) => sum + p.stops.length, 0);
            return (
              <section key={place.placeKey} className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-brand px-4 py-3 text-white">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                    {placeIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">📍 {place.placeLabel}</p>
                    <p className="text-xs text-white/80">
                      {place.stops.length} stop
                      {place.stops.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {place.stops.map((p, i) => (
                    <li key={p.id}>
                      {renderParcelCard(p, baseIndex + i + 1)}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : null}

      {!loading && !tourActive && active.length > 0 ? (
        <ul className="space-y-4">
          {active.map((p) => (
            <li key={p.id}>{renderParcelCard(p)}</li>
          ))}
        </ul>
      ) : null}

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <form
            onSubmit={onConfirmComment}
            className="w-full max-w-md rounded-2xl border border-cream bg-surface p-5 shadow-soft"
          >
            <p className="font-display text-lg font-bold text-ink">
              <span aria-hidden className="mr-1.5">
                {pending.action.emoji}
              </span>
              {pending.action.label}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              {pending.parcel.code} · {pending.parcel.recipientName}
            </p>
            <label className="mt-4 block text-sm font-medium text-ink">
              {pending.action.commentLabel ?? "Commentaire"}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                required
                className="mt-1.5 w-full rounded-xl border border-cream px-3 py-2.5 text-sm outline-none ring-brand focus:ring-2"
                placeholder="Ex. report demain 10h, numéro erroné…"
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPending(null);
                  setComment("");
                }}
                className="flex-1 rounded-xl border border-cream py-2.5 text-sm font-semibold text-ink"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busyId === pending.parcel.id}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirmer
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <Link
        href="/livreur/parcels"
        className="block text-center text-sm font-semibold text-brand"
      >
        Liste complète (table) →
      </Link>
    </div>
  );
}
