"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Clock3,
  MapPin,
  MessageSquareWarning,
  Phone,
  Printer,
  Truck,
  User,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
  StatusBadge,
  buttonClass,
} from "@/components/ui";
import { DELIVERY_WINDOWS } from "@/lib/delivery-windows";
import { formatTnd, type Parcel } from "@/lib/domain";
import { mapsNavigateUrl } from "@/lib/geolocation";
import { canSeeDeliveryMode } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";
import { useApiQuery } from "@/lib/use-api";

const PROGRESS_STEPS = [
  { key: "created", label: "Créé", statuses: ["EN_ATTENTE", "NON_SERIEUX"] },
  { key: "pickup", label: "Enlèvement", statuses: ["A_ENLEVER", "ENLEVES", "AU_DEPOT"] },
  { key: "transit", label: "En livraison", statuses: ["EN_COURS", "A_VERIFIER", "RETOUR_DEPOT"] },
  { key: "done", label: "Livré", statuses: ["LIVRES", "LIVRES_PAYES", "ECHANGES", "REMBOURSES"] },
] as const;

function progressIndex(status: string) {
  return PROGRESS_STEPS.findIndex((s) => (s.statuses as readonly string[]).includes(status));
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export function ParcelDetailView({
  parcelId,
  backHref,
  portalBase,
}: {
  parcelId: string;
  backHref: string;
  portalBase: string;
}) {
  const { session } = useAuth();
  const showModes = canSeeDeliveryMode(session?.user.role);
  const { data: parcel, error, loading } = useApiQuery<Parcel>(`/parcels/${parcelId}`);

  if (loading && !parcel) return <LoadingBlock rows={3} label="Chargement du colis…" />;
  if (error || !parcel) {
    return (
      <EmptyState
        title="Colis introuvable"
        description={error ?? "Ce colis n'existe pas ou n'est pas accessible."}
        action={
          <Link href={backHref} className={buttonClass("secondary")}>
            Retour à la liste
          </Link>
        }
      />
    );
  }

  const step = progressIndex(parcel.status);
  const isReturn = parcel.status.startsWith("RETOUR") || parcel.status === "SAISIE_DOUANE";
  const slot = DELIVERY_WINDOWS.find((w) => w.id === parcel.deliveryWindow);
  const hasGps = parcel.lat != null && parcel.lng != null;
  const timeline = parcel.timeline?.length
    ? [...parcel.timeline].reverse()
    : [{ at: parcel.createdAt, label: "Colis créé" }];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Colis"
        title={parcel.code ?? `#${parcel.id}`}
        description={`${parcel.recipientName} · ${parcel.city}, ${parcel.governorate}`}
        actions={
          <>
            <Link href={backHref} className={buttonClass("secondary")}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour
            </Link>
            <Link href={`${portalBase}/tickets`} className={buttonClass("secondary")}>
              <MessageSquareWarning className="h-4 w-4" aria-hidden />
              Signaler
            </Link>
            <Link href={`${portalBase}/bordereau?id=${parcel.id}`} className={buttonClass("primary")}>
              <Printer className="h-4 w-4" aria-hidden />
              Bordereau
            </Link>
          </>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={parcel.status} />
            {showModes ? <Badge tone="info">{parcel.mode}</Badge> : null}
            {parcel.tryProduct ? <Badge tone="warning">Essai produit</Badge> : null}
            {parcel.isExchange ? <Badge tone="gold">Échange</Badge> : null}
          </div>
          <p className="font-display text-2xl font-extrabold text-brand">
            {formatTnd(parcel.price)}
          </p>
        </div>
        {isReturn ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-400/10 dark:text-red-200">
            Ce colis est en circuit retour.
          </p>
        ) : (
          <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Progression">
            {PROGRESS_STEPS.map((s, i) => {
              const reached = step >= i;
              return (
                <li key={s.key} className="space-y-2">
                  <div
                    className={`h-1.5 rounded-full ${reached ? "bg-brand" : "bg-cream-soft"}`}
                    aria-hidden
                  />
                  <p
                    className={`text-[11px] font-semibold ${reached ? "text-ink" : "text-ink-muted"}`}
                  >
                    {s.label}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <h2 className="font-display text-lg font-bold text-ink">Destinataire & adresse</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Destinataire">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4 text-ink-muted" aria-hidden />
                  {parcel.recipientName}
                </span>
              </Detail>
              <Detail label="Téléphone">
                <a href={`tel:${parcel.phone}`} className="inline-flex items-center gap-1.5 text-brand hover:underline">
                  <Phone className="h-4 w-4" aria-hidden />
                  {parcel.phone}
                </a>
                {parcel.phone2 ? <span className="ml-2 text-ink-muted">/ {parcel.phone2}</span> : null}
              </Detail>
              <Detail label="Adresse">
                <span className="inline-flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  <span>
                    {parcel.address}
                    <br />
                    <span className="text-ink-muted">
                      {parcel.city}, {parcel.governorate}
                    </span>
                  </span>
                </span>
              </Detail>
              <Detail label="Localisation GPS">
                {hasGps ? (
                  <a
                    href={mapsNavigateUrl({
                      destLat: parcel.lat,
                      destLng: parcel.lng,
                      destLabel: `${parcel.address}, ${parcel.city}, Tunisie`,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    {parcel.lat?.toFixed(5)}, {parcel.lng?.toFixed(5)}
                  </a>
                ) : (
                  <span className="text-ink-muted">Non renseignée</span>
                )}
                {parcel.addressQuality != null ? (
                  <span className="ml-2 text-xs text-ink-muted">
                    Qualité {parcel.addressQuality}/100
                  </span>
                ) : null}
              </Detail>
              <Detail label="Créneau">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-ink-muted" aria-hidden />
                  {slot ? `${slot.label} (${slot.hint})` : "Toute la journée"}
                </span>
              </Detail>
              <Detail label="Photo repère">
                <span className="inline-flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-ink-muted" aria-hidden />
                  {parcel.landmarkPhotoName ?? "—"}
                </span>
              </Detail>
            </dl>
          </Panel>

          <Panel>
            <h2 className="font-display text-lg font-bold text-ink">Colis & livraison</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Detail label="Désignation">{parcel.designation ?? "—"}</Detail>
              <Detail label="Articles">{parcel.articleCount ?? 1}</Detail>
              <Detail label="Paiement">{parcel.paymentMode ?? "espèce"}</Detail>
              <Detail label="Livreur">
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-ink-muted" aria-hidden />
                  {parcel.driver?.name ?? "Non assigné"}
                </span>
              </Detail>
              <Detail label="Zone">{parcel.zone?.name ?? "—"}</Detail>
              <Detail label="Créé le">
                {new Date(parcel.createdAt).toLocaleString("fr-TN")}
              </Detail>
            </dl>
            {parcel.notes ? (
              <p className="mt-4 rounded-xl bg-cream-soft/40 px-4 py-3 text-sm text-ink">
                {parcel.notes}
              </p>
            ) : null}
            {parcel.isExchange && parcel.exchangeNotes ? (
              <p className="mt-3 text-sm text-ink-muted">Échange : {parcel.exchangeNotes}</p>
            ) : null}
          </Panel>
        </div>

        <Panel>
          <h2 className="font-display text-lg font-bold text-ink">Historique</h2>
          <ol className="relative mt-5 space-y-5 border-l border-cream pl-5">
            {timeline.map((ev, i) => (
              <li key={`${ev.at}-${i}`} className="relative">
                <span
                  className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface ${i === 0 ? "bg-brand" : "bg-cream"}`}
                  aria-hidden
                />
                <p className="text-sm font-semibold text-ink">{ev.label}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(ev.at).toLocaleString("fr-TN")}
                  {"actor" in ev && ev.actor ? ` · ${ev.actor}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
