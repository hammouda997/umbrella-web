"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Crosshair, MapPin, Phone, RefreshCw, Route } from "lucide-react";
import { useToast } from "@/components/Feedback";
import { Modal } from "@/components/Modal";
import {
  Button,
  EmptyState,
  LoadingBlock,
  Panel,
} from "@/components/ui";
import {
  DashboardHero,
  DashboardPromo,
} from "@/components/DashboardHero";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  estimateParcelCoords,
  sortByDistanceFrom,
} from "@/lib/geo-distance";
import {
  getCurrentPositionPrecise,
  mapsNavigateUrl,
  queryGeoPermission,
} from "@/lib/geolocation";
import { pushLocalActivity } from "@/lib/local-activity";
import {
  ACTION_TONE_CLASS,
  formatDisplayPhone,
  livreurActionsFor,
  smsHref,
  telHref,
  whatsappHref,
  type LivreurAction,
} from "@/lib/livreur-actions";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import {
  buildTourByPlaces,
  flattenTourStops,
  googleMapsTourUrl,
} from "@/lib/tour-planner";

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
  lat?: number | null;
  lng?: number | null;
};

function defaultDatetimeLocal(): string {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatReportComment(datetimeLocal: string): string {
  const [datePart, timePart = "00:00"] = datetimeLocal.split("T");
  const time = timePart.slice(0, 5);
  return `Reporté au ${datePart} ${time}`;
}

export function LivreurTour() {
  const { session } = useAuth();
  const toast = useToast();
  const [parcels, setParcels] = useState<TourParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [myPosition, setMyPosition] = useState<{
    lat: number;
    lng: number;
    accuracyMeters: number;
  } | null>(null);
  const [pending, setPending] = useState<{
    parcel: TourParcel;
    action: LivreurAction;
  } | null>(null);
  const [comment, setComment] = useState("");
  const [reportAt, setReportAt] = useState(defaultDatetimeLocal);
  const [inAppCall, setInAppCall] = useState<TourParcel | null>(null);

  const userId = session?.user.id ?? 0;

  function notifyAction(title: string, body: string, targetId?: number) {
    toast.info(title, body);
    if (userId) {
      pushLocalActivity({
        userId,
        title,
        body,
        kind: "parcel",
        targetId: targetId ?? null,
      });
    }
  }

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

  const activeRaw = useMemo(
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

  const nearMe = useMemo(() => {
    if (!myPosition) return null;
    return sortByDistanceFrom(activeRaw, myPosition, (p) =>
      estimateParcelCoords({
        lat: p.lat,
        lng: p.lng,
        city: p.city,
        governorate: p.governorate,
      }),
    );
  }, [activeRaw, myPosition]);

  const active = useMemo((): TourParcel[] => {
    if (!nearMe) return activeRaw;
    return nearMe.map((item) => {
      const { distanceKm, ...parcel } = item;
      void distanceKm;
      return parcel;
    });
  }, [activeRaw, nearMe]);

  const done = useMemo(
    () => parcels.filter((p) => ["LIVRES", "LIVRES_PAYES"].includes(p.status)),
    [parcels],
  );

  const places = useMemo(
    () => (tourActive ? buildTourByPlaces(active, myPosition) : []),
    [tourActive, active, myPosition],
  );

  const orderedStops = useMemo(() => flattenTourStops(places), [places]);

  const mapsUrl = useMemo(
    () => googleMapsTourUrl(orderedStops, myPosition),
    [orderedStops, myPosition],
  );

  async function captureMyPosition() {
    setLocating(true);
    const permission = await queryGeoPermission();
    if (permission === "unsupported") {
      setMessage(
        "Localisation indisponible. Utilisez HTTPS / localhost et activez le GPS.",
      );
      setLocating(false);
      return;
    }
    const result = await getCurrentPositionPrecise();
    if (!result.ok) {
      setMessage(result.message);
      setLocating(false);
      return;
    }
    setMyPosition(result.coords);
    setMessage(
      `Position capturée (±${Math.round(result.coords.accuracyMeters)} m) — colis triés du plus proche.`,
    );
    setLocating(false);
  }

  function demandTour() {
    if (active.length === 0) {
      setMessage("Aucun colis actif à organiser");
      return;
    }
    setGenerating(true);
    setMessage(null);
    window.setTimeout(() => {
      setTourActive(true);
      const planned = buildTourByPlaces(active, myPosition);
      setMessage(
        myPosition
          ? `🗺️ Tournée prête depuis votre GPS · ${planned.length} lieu(x) · ${active.length} stop(s)`
          : `🗺️ Tournée prête · ${planned.length} lieu(x) · ${active.length} stop(s). Activez « Ma position » pour plus de précision.`,
      );
      setGenerating(false);
    }, 450);
  }

  function clearTour() {
    setTourActive(false);
    setMessage("Tournée réinitialisée — liste simple");
  }

  async function applyStatus(
    parcel: TourParcel,
    status: string,
    note: string | undefined,
    actionLabel: string,
  ) {
    if (!session?.accessToken) return;
    setBusyId(parcel.id);
    setMessage(null);
    try {
      await apiFetch(`/parcels/${parcel.id}/status`, {
        method: "PATCH",
        token: session.accessToken,
        body: JSON.stringify({
          status,
          comment: note || undefined,
          actor: "LIVREUR",
        }),
      });
      const body = note
        ? `${parcel.code ?? parcel.id} · ${note}`
        : `${parcel.code ?? parcel.id} · ${STATUS_META[status as StatusKey]?.label ?? status}`;
      toast.success(actionLabel, body);
      if (userId) {
        pushLocalActivity({
          userId,
          title: actionLabel,
          body,
          kind: "parcel",
          targetId: parcel.id,
        });
      }
      setMessage("Statut mis à jour");
      setPending(null);
      setComment("");
      setReportAt(defaultDatetimeLocal());
      await load();
    } catch (e) {
      const err = e instanceof Error ? e.message : "Erreur";
      toast.error("Échec", err);
      setMessage(err);
    } finally {
      setBusyId(null);
    }
  }

  function onAction(parcel: TourParcel, action: LivreurAction) {
    if (action.needsDatetime || action.needsComment) {
      setPending({ parcel, action });
      setComment(
        action.id === "bad-phone"
          ? "Téléphone incorrect"
          : action.id === "bad-address"
            ? "Adresse incorrecte"
            : action.id === "blocked"
              ? "Livreur bloqué"
              : "",
      );
      setReportAt(defaultDatetimeLocal());
      return;
    }
    void applyStatus(parcel, action.status, undefined, action.label);
  }

  function onConfirmComment(e: FormEvent) {
    e.preventDefault();
    if (!pending) return;
    if (pending.action.needsDatetime) {
      if (!reportAt) {
        setMessage("Choisissez une date et une heure");
        return;
      }
      void applyStatus(
        pending.parcel,
        pending.action.status,
        formatReportComment(reportAt),
        pending.action.label,
      );
      return;
    }
    if (!comment.trim()) {
      setMessage("Un commentaire est requis pour cette action");
      return;
    }
    void applyStatus(
      pending.parcel,
      pending.action.status,
      comment.trim(),
      pending.action.label,
    );
  }

  function onNativeCall(parcel: TourParcel) {
    notifyAction(
      "Appel (téléphone)",
      `${parcel.code ?? parcel.id} · ${formatDisplayPhone(parcel.phone)}`,
      parcel.id,
    );
  }

  function onInAppCall(parcel: TourParcel) {
    setInAppCall(parcel);
    notifyAction(
      "Appel (site)",
      `${parcel.code ?? parcel.id} · ${formatDisplayPhone(parcel.phone)}`,
      parcel.id,
    );
  }

  function onSms(parcel: TourParcel) {
    notifyAction(
      "SMS",
      `${parcel.code ?? parcel.id} · ${formatDisplayPhone(parcel.phone)}`,
      parcel.id,
    );
  }

  function onWhatsApp(parcel: TourParcel) {
    notifyAction(
      "WhatsApp",
      `${parcel.code ?? parcel.id} · ${formatDisplayPhone(parcel.phone)}`,
      parcel.id,
    );
  }

  function renderParcelCard(
    p: TourParcel,
    stopIndex?: number,
    distanceKm?: number | null,
  ) {
    const statusLabel =
      STATUS_META[p.status as StatusKey]?.label ?? p.status;
    const actions = livreurActionsFor(p.status);
    const busy = busyId === p.id;

    return (
      <article className="rounded-2xl border border-ops-card bg-ops-surface p-4 shadow-ops">
        <div className="flex items-start justify-between gap-3">
          <div>
            {stopIndex != null ? (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ops-accent">
                Stop {stopIndex}
              </p>
            ) : null}
            <p className="font-mono text-xs font-semibold text-ops-accent">
              {p.code}
            </p>
            <h2 className="mt-0.5 font-display text-lg font-bold text-ops-ink">
              {p.recipientName}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-ops-ink/50">
              <MapPin className="h-3.5 w-3.5" />
              {p.city} · {p.governorate}
              {distanceKm != null ? (
                <span className="ml-1 font-semibold text-ops-accent">
                  ·{" "}
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m`
                    : `${distanceKm.toFixed(1)} km`}
                </span>
              ) : null}
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

        <p className="mt-3 text-sm text-ops-ink/50">{p.address}</p>
        <p className="mt-1 text-sm font-semibold text-ops-ink">
          {formatDisplayPhone(p.phone)}
        </p>
        <p className="mt-0.5 font-semibold text-ops-ink">{p.price} TND COD</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={telHref(p.phone)}
            onClick={() => onNativeCall(p)}
            className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-ops-card bg-ops-surface px-3 py-3 text-sm font-bold text-ops-ink"
          >
            <Phone className="h-4 w-4" />
            Appel tél.
          </a>
          <button
            type="button"
            onClick={() => onInAppCall(p)}
            className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-ops-card bg-ops-surface px-3 py-3 text-sm font-bold text-ops-ink"
          >
            <span aria-hidden>💻</span>
            Appel site
          </button>
          <a
            href={smsHref(p.phone)}
            onClick={() => onSms(p)}
            className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-ops-card bg-ops-surface px-3 py-3 text-sm font-bold text-ops-ink"
          >
            <span aria-hidden>💬</span>
            Msg
          </a>
          <a
            href={whatsappHref(p.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={() => onWhatsApp(p)}
            className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-3 text-sm font-bold text-ops-ink"
          >
            <span aria-hidden>🟢</span>
            WhatsApp
          </a>
          <a
            href={mapsNavigateUrl({
              destLabel: `${p.address}, ${p.city}, ${p.governorate.replace(/_/g, " ")}, Tunisie`,
              originLat: myPosition?.lat,
              originLng: myPosition?.lng,
            })}
            target="_blank"
            rel="noreferrer"
            className="col-span-2 inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-ops-card py-3 text-sm font-bold text-ops-ink"
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
              className={`inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-bold disabled:opacity-50 ${ACTION_TONE_CLASS[action.tone]}`}
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
      <DashboardHero
        subtitle="Prêt pour une nouvelle journée ?"
        actions={[
          { href: "/livreur/parcels", label: "Mes colis" },
          { href: "/livreur/settings", label: "Profil" },
        ]}
      />

      <div className="flex justify-center lg:justify-end">
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load()
              .catch((e: Error) => setMessage(e.message))
              .finally(() => setLoading(false));
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ops-card px-3 py-2 text-sm font-semibold text-ops-ink"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraîchir la tournée
        </button>
      </div>

      <Panel className="space-y-3">
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ops-accent/15 text-xl">
            🛵
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-ops-ink">
              Tournée intelligente
            </p>
            <p className="text-sm text-ops-ink/50">
              Regroupe vos colis par ville / gouvernorat et propose un ordre de
              passage.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={locating}
            onClick={() => void captureMyPosition()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ops-card px-4 py-3 text-sm font-semibold text-ops-ink disabled:opacity-50"
          >
            <Crosshair className="h-4 w-4" />
            {locating
              ? "GPS…"
              : myPosition
                ? `Position ±${Math.round(myPosition.accuracyMeters)} m`
                : "Ma position"}
          </button>
          <button
            type="button"
            disabled={generating || active.length === 0}
            onClick={demandTour}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ops-accent px-4 py-3 text-sm font-semibold text-white hover:bg-ops-accent-soft disabled:opacity-50"
          >
            <Route className="h-4 w-4" />
            {generating ? "Organisation…" : "Demander une tournée"}
          </button>
          {tourActive ? (
            <button
              type="button"
              onClick={clearTour}
              className="rounded-xl border border-ops-card px-4 py-3 text-sm font-semibold text-ops-ink"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ops-card bg-ops-ink/[0.05] px-4 py-2.5 text-sm font-semibold text-ops-ink"
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
            <p className="font-display text-xl font-bold text-ops-ink">{n}</p>
            <p className="text-[11px] uppercase tracking-wide text-ops-ink/50">
              {label}
            </p>
          </Panel>
        ))}
      </div>

      {message ? (
        <p className="rounded-xl border border-ops-card bg-ops-surface px-4 py-2 text-sm font-medium text-ops-ink">
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
              className="text-sm font-semibold text-ops-accent"
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
              .reduce((sum, pl) => sum + pl.stops.length, 0);
            return (
              <section key={place.placeKey} className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-ops-accent px-4 py-3 text-white">
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
                  {place.stops.map((parcel, i) => (
                    <li key={parcel.id}>
                      {renderParcelCard(parcel, baseIndex + i + 1)}
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
          {(nearMe ?? activeRaw.map((p) => ({ ...p, distanceKm: null }))).map(
            (p) => (
              <li key={p.id}>
                {renderParcelCard(p, undefined, p.distanceKm)}
              </li>
            ),
          )}
        </ul>
      ) : null}

      <DashboardPromo />

      <Modal
        open={Boolean(pending)}
        onClose={() => {
          setPending(null);
          setComment("");
        }}
        title={pending?.action.label ?? "Action"}
        description={
          pending
            ? `${pending.parcel.code ?? pending.parcel.id} · ${pending.parcel.recipientName}`
            : undefined
        }
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setPending(null);
                setComment("");
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              form="livreur-action-form"
              loading={Boolean(pending && busyId === pending.parcel.id)}
            >
              Confirmer
            </Button>
          </div>
        }
      >
        {pending ? (
          <form id="livreur-action-form" onSubmit={onConfirmComment} className="space-y-3">
            {pending.action.needsDatetime ? (
              <label className="block text-sm font-medium text-ops-ink">
                Reporter au
                <input
                  type="datetime-local"
                  value={reportAt}
                  onChange={(e) => setReportAt(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border border-ops-card px-3 py-3 text-base outline-none ring-ops-accent focus:ring-2"
                />
              </label>
            ) : (
              <label className="block text-sm font-medium text-ops-ink">
                {pending.action.commentLabel ?? "Commentaire"}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  required
                  className="mt-1.5 w-full rounded-xl border border-ops-card px-3 py-2.5 text-sm outline-none ring-ops-accent focus:ring-2"
                  placeholder="Détail…"
                />
              </label>
            )}
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(inAppCall)}
        onClose={() => setInAppCall(null)}
        title="Appel en cours"
        description={
          inAppCall
            ? `${inAppCall.code ?? inAppCall.id} · simulation (pas de VoIP)`
            : undefined
        }
        size="md"
        footer={
          <Button
            className="w-full"
            onClick={() => {
              if (!inAppCall) return;
              notifyAction(
                "Appel terminé",
                `${inAppCall.code ?? inAppCall.id} · raccroché`,
                inAppCall.id,
              );
              setInAppCall(null);
            }}
          >
            Raccrocher
          </Button>
        }
      >
        {inAppCall ? (
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-ops-ink">
              {inAppCall.recipientName}
            </p>
            <p className="mt-2 font-mono text-lg font-semibold text-ops-accent">
              {formatDisplayPhone(inAppCall.phone)}
            </p>
          </div>
        ) : null}
      </Modal>

      <Link
        href="/livreur/parcels"
        className="block text-center text-sm font-semibold text-ops-accent"
      >
        Liste complète (table) →
      </Link>
    </div>
  );
}
