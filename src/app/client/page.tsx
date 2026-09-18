"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, Ticket } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import {
  EmptyState,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui";
import type { DetailParcel } from "@/components/ParcelDetailTable";

export default function ClientPage() {
  const { session } = useAuth();
  const [parcels, setParcels] = useState<DetailParcel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiFetch<DetailParcel[]>("/parcels", { token: session.accessToken })
      .then(setParcels)
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Mes livraisons"
        description="Suivez vos colis et ouvrez un ticket si besoin"
        actions={
          <Link
            href="/client/tickets"
            className="inline-flex items-center gap-2 rounded-xl border border-cream px-3 py-2 text-sm font-semibold text-ink hover:border-brand"
          >
            <Ticket className="h-4 w-4" />
            Support
          </Link>
        }
      />

      {loading ? <LoadingBlock label="Chargement…" /> : null}

      {!loading && parcels.length === 0 ? (
        <EmptyState
          title="Aucune livraison"
          description="Vos colis apparaîtront ici dès qu'un envoi vous est destiné."
          action={
            <Link href="/track" className="text-sm font-semibold text-brand">
              Suivre un code
            </Link>
          }
        />
      ) : null}

      <ul className="space-y-3">
        {parcels.map((p) => {
          const status =
            STATUS_META[p.status as StatusKey]?.label ?? p.status;
          return (
            <li key={p.id}>
              <Panel className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <PackageSearch className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-mono text-xs font-semibold text-brand">
                      {p.code}
                    </p>
                    <p className="font-display text-lg font-bold text-ink">
                      {status}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {p.city}, {p.governorate}
                    </p>
                    <p className="text-xs text-ink-muted">
                      Mis à jour{" "}
                      {new Date(p.createdAt).toLocaleDateString("fr-TN")}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/track?code=${encodeURIComponent(p.code ?? "")}`}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-soft"
                >
                  Timeline
                </Link>
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
