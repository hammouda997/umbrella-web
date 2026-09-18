"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import { EmptyState, LoadingBlock } from "@/components/ui";

type TrackResult = {
  code: string | null;
  status: string;
  recipientName: string;
  city: string;
  governorate: string;
  updatedAt: string;
  timeline?: Array<{ at: string; label: string }>;
};

const DEFAULT_STEPS = [
  "Créé",
  "Enlevé",
  "Au dépôt",
  "En livraison",
  "Livré",
];

function statusStepIndex(status: string): number {
  const map: Record<string, number> = {
    NOUVEAU: 0,
    ENLEVE: 1,
    AU_DEPOT: 2,
    EN_LIVRAISON: 3,
    LIVRE: 4,
    RETOUR: 2,
    ANNULE: -1,
  };
  return map[status] ?? 1;
}

export function PublicTrackForm({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<TrackResult>(
        `/parcels/track/${encodeURIComponent(trimmed)}`,
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Introuvable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialCode.trim()) {
      lookup(initialCode).catch(() => undefined);
    }
  }, [initialCode]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await lookup(code);
  }

  const statusLabel =
    result && STATUS_META[result.status as StatusKey]
      ? STATUS_META[result.status as StatusKey].label
      : result?.status;

  const step = result ? statusStepIndex(result.status) : -1;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-cream bg-surface p-4 shadow-soft sm:p-5"
      >
        <label className="block text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Code colis
        </label>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="ex. UMB-1042"
            className="flex-1 rounded-xl border border-cream-soft bg-cream-soft/30 px-4 py-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-soft disabled:opacity-50"
          >
            {loading ? "…" : "Suivre"}
          </button>
        </div>
        <p className="mt-2 text-left text-[11px] text-ink-muted">
          Démo : essayez{" "}
          <button
            type="button"
            className="font-semibold text-brand hover:underline"
            onClick={() => {
              setCode("UMB-ATT-001");
              void lookup("UMB-ATT-001");
            }}
          >
            UMB-ATT-001
          </button>
        </p>
      </form>

      {loading ? <LoadingBlock label="Recherche du colis…" /> : null}

      {error ? (
        <EmptyState
          title="Colis introuvable"
          description={error}
          action={
            <Link href="/contact" className="text-sm font-semibold text-brand">
              Contacter le support
            </Link>
          }
        />
      ) : null}

      {result ? (
        <div className="overflow-hidden rounded-2xl border border-cream bg-surface shadow-soft">
          <div className="border-b border-cream-soft bg-cream-soft/40 px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <PackageSearch className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {result.code}
                </p>
                <h2 className="font-display text-2xl font-bold text-ink">
                  {statusLabel}
                </h2>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <ol className="flex justify-between gap-1">
              {DEFAULT_STEPS.map((label, i) => {
                const done = step >= 0 && i <= step;
                return (
                  <li
                    key={label}
                    className="flex flex-1 flex-col items-center text-center"
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        done ? "bg-brand" : "bg-cream-soft"
                      }`}
                    />
                    <span
                      className={`mt-2 text-[10px] font-medium ${
                        done ? "text-ink" : "text-ink-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Destinataire</dt>
                <dd className="font-medium text-ink">{result.recipientName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Ville</dt>
                <dd className="font-medium text-ink">
                  {result.city}, {result.governorate}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Mis à jour</dt>
                <dd className="font-medium text-ink">
                  {new Date(result.updatedAt).toLocaleString("fr-TN")}
                </dd>
              </div>
            </dl>

            {result.timeline?.length ? (
              <ul className="mt-6 space-y-3 border-t border-cream-soft pt-5">
                {result.timeline.map((ev) => (
                  <li key={`${ev.at}-${ev.label}`} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p className="font-medium text-ink">{ev.label}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(ev.at).toLocaleString("fr-TN")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
