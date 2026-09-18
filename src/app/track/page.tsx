"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicTrackForm } from "@/components/PublicTrackForm";

function TrackInner() {
  const params = useSearchParams();
  const code = params.get("code") ?? "";
  return <PublicTrackForm initialCode={code} />;
}

export default function TrackPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-cream-soft to-page px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          Umbrella Express
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-ink">
          Suivi de colis
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Entrez le code figurant sur votre bordereau
        </p>
      </div>
      <div className="mt-10">
        <Suspense fallback={<p className="text-center text-sm text-ink-muted">…</p>}>
          <TrackInner />
        </Suspense>
      </div>
    </main>
  );
}
