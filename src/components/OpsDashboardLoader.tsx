"use client";

import { Loader2 } from "lucide-react";

export function OpsDashboardLoader({
  label = "Chargement du tableau de bord…",
}: {
  label?: string;
}) {
  return (
    <div
      className="relative -mx-3 min-h-[22rem] overflow-hidden rounded-2xl bg-ops-page px-3 py-3 md:-mx-4 md:px-4 lg:-mx-5 lg:px-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="pointer-events-none select-none space-y-3 opacity-60 blur-[1.5px]"
        aria-hidden
      >
        <div className="h-24 animate-pulse rounded-2xl border border-ops-card bg-ops-surface" />
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[5.5rem] animate-pulse rounded-2xl border border-ops-card bg-ops-surface"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="h-44 animate-pulse rounded-2xl border border-ops-card bg-ops-surface lg:col-span-8" />
          <div className="h-44 animate-pulse rounded-2xl border border-ops-card bg-ops-surface lg:col-span-4" />
        </div>
        <div className="h-52 animate-pulse rounded-2xl border border-ops-card bg-ops-surface" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-ops-page/35 backdrop-blur-[2px]">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-ops-card bg-ops-surface/95 px-7 py-6 shadow-ops">
          <Loader2
            className="h-8 w-8 animate-spin text-ops-accent"
            strokeWidth={2.25}
            aria-hidden
          />
          <p className="text-sm font-semibold text-ops-ink">{label}</p>
        </div>
      </div>
    </div>
  );
}
