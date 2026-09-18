"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import { EmptyState, LoadingBlock, PageHeader, Panel } from "@/components/ui";
import type { MockParcel } from "@/lib/mock-data";
import { canSeeDeliveryMode } from "@/lib/roles";

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
  const [parcel, setParcel] = useState<MockParcel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    apiFetch<MockParcel>(`/parcels/${parcelId}`, {
      token: session.accessToken,
    })
      .then(setParcel)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, parcelId]);

  if (loading) return <LoadingBlock label="Chargement du colis…" />;
  if (error || !parcel) {
    return (
      <EmptyState
        title="Colis introuvable"
        description={error ?? "Ce colis n'existe pas."}
        action={
          <Link href={backHref} className="text-sm font-semibold text-brand">
            Retour à la liste
          </Link>
        }
      />
    );
  }

  const statusLabel =
    STATUS_META[parcel.status as StatusKey]?.label ?? parcel.status;

  return (
    <div className="space-y-6">
      <PageHeader
        title={parcel.code}
        description={`${parcel.recipientName} · ${statusLabel}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cream px-3 py-2 text-sm font-medium text-ink hover:border-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
            <Link
              href={`${portalBase}/bordereau?id=${parcel.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-soft"
            >
              <Printer className="h-4 w-4" />
              Bordereau
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-lg font-bold text-ink">Détails</h2>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            {(
              [
                ["Téléphone", parcel.phone],
                ["Adresse", parcel.address],
                ["Ville", `${parcel.city}, ${parcel.governorate}`],
                ["Prix COD", `${parcel.price} TND`],
                ...(showModes ? [["Mode", parcel.mode] as const] : []),
                ["Désignation", parcel.notes ?? parcel.designation ?? "—"],
                ["Livreur", parcel.driver?.name ?? "—"],
                ["Zone", parcel.zone?.name ?? "—"],
                [
                  "Essai produit",
                  parcel.tryProduct
                    ? "Oui — responsabilité expéditeur acceptée"
                    : "Non",
                ],
              ] as Array<readonly [string, string]>
            ).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-ink-muted">
                  {k}
                </dt>
                <dd className="mt-0.5 font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel>
          <h2 className="font-display text-lg font-bold text-ink">Timeline</h2>
          <ul className="mt-4 space-y-4">
            {(parcel.timeline ?? [{ at: parcel.createdAt, label: "Créé" }]).map(
              (ev) => (
                <li key={`${ev.at}-${ev.label}`} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
                  <div>
                    <p className="font-medium text-ink">{ev.label}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(ev.at).toLocaleString("fr-TN")}
                    </p>
                  </div>
                </li>
              ),
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
