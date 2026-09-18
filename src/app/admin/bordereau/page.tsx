"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Panel, LoadingBlock, EmptyState } from "@/components/ui";
import type { MockParcel } from "@/lib/mock-data";
import { openBordereauPdf } from "@/lib/parcel-report";

function BordereauInner() {
  const { session } = useAuth();
  const params = useSearchParams();
  const id = params.get("id");
  const [parcel, setParcel] = useState<MockParcel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken || !id) {
      setLoading(false);
      return;
    }
    apiFetch<MockParcel>(`/parcels/${id}`, { token: session.accessToken })
      .then(setParcel)
      .catch(() => setParcel(null))
      .finally(() => setLoading(false));
  }, [session, id]);

  if (loading) return <LoadingBlock label="Préparation du bordereau…" />;
  if (!parcel) {
    return (
      <EmptyState
        title="Bordereau indisponible"
        description="Sélectionnez un colis depuis la liste pour prévisualiser."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bordereau"
        description={parcel.code}
        actions={
          <button
            type="button"
            onClick={() => {
              try {
                openBordereauPdf(parcel);
              } catch (err) {
                window.alert(
                  err instanceof Error ? err.message : "Impression impossible",
                );
              }
            }}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white print:hidden"
          >
            Imprimer / PDF
          </button>
        }
      />

      <Panel className="mx-auto max-w-lg print:border-0 print:shadow-none">
        <div className="border-b border-cream-soft pb-4 text-center">
          <p className="font-display text-2xl font-extrabold text-brand">
            Umbrella Express
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
            Bordereau de livraison
          </p>
        </div>
        <div className="mt-6 space-y-4 text-sm">
          <p className="font-mono text-lg font-bold tracking-wide text-ink">
            {parcel.code}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] uppercase text-ink-muted">Destinataire</p>
              <p className="font-semibold">{parcel.recipientName}</p>
              <p>{parcel.phone}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-ink-muted">COD</p>
              <p className="font-display text-xl font-bold text-brand">
                {parcel.price} TND
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase text-ink-muted">Adresse</p>
            <p className="font-medium">
              {parcel.address}
              <br />
              {parcel.city}, {parcel.governorate}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-ink-muted">Contenu</p>
            <p>{parcel.notes ?? parcel.designation ?? "—"}</p>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="h-16 w-48 rounded border border-dashed border-ink/30 bg-cream-soft/50" />
          </div>
          <p className="text-center text-[10px] text-ink-muted">
            Code-barres (aperçu démo)
          </p>
        </div>
      </Panel>
    </div>
  );
}

export default function BordereauPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <BordereauInner />
    </Suspense>
  );
}
