"use client";

import { useMemo, useState } from "react";
import { errorText, useToast } from "@/components/Feedback";
import {
  Badge,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
} from "@/components/ui";
import type { DeliveryMode, DeliveryRoute } from "@/lib/domain";
import { TUNISIA_GOVERNORATES } from "@/lib/status-meta";
import { useApi, useApiQuery } from "@/lib/use-api";
import { cn } from "@/lib/cn";

const INTERNAL_DEFAULT = new Set([
  "Tunis",
  "Ariana",
  "Ben Arous",
  "La Mannouba",
]);

function modeLabel(mode: DeliveryMode) {
  return mode === "EXTERNAL" ? "Navex" : "Umbrella";
}

export function DeliveryRoutesManager() {
  const request = useApi();
  const toast = useToast();
  const { data, error, loading, reload } = useApiQuery<DeliveryRoute[]>(
    "/delivery-routes",
  );
  const routes = useMemo(() => data ?? [], [data]);
  const [busyGov, setBusyGov] = useState<string | null>(null);

  const byGov = useMemo(() => {
    const map = new Map<string, DeliveryMode>();
    for (const r of routes) {
      map.set(r.governorate.toLowerCase(), r.mode);
    }
    return map;
  }, [routes]);

  function resolvedMode(governorate: string): DeliveryMode {
    return (
      byGov.get(governorate.toLowerCase()) ??
      (INTERNAL_DEFAULT.has(governorate) ? "INTERNAL" : "EXTERNAL")
    );
  }

  async function setMode(governorate: string, mode: DeliveryMode) {
    if (resolvedMode(governorate) === mode) return;
    setBusyGov(governorate);
    try {
      await request("/delivery-routes", "PUT", { governorate, mode });
      toast.success(
        `${governorate} → ${modeLabel(mode)}`,
        mode === "EXTERNAL"
          ? "Auto: colis poussés vers Navex"
          : "Auto: livraison Umbrella interne",
      );
      await reload();
    } catch (err) {
      toast.error("Enregistrement impossible", errorText(err));
    } finally {
      setBusyGov(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auto par lieu"
        description="Pour chaque gouvernorat, choisissez si les nouveaux colis partent automatiquement vers Navex (EXTERNAL) ou restent Umbrella (INTERNAL). Le mode reste modifiable à la création et après."
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}
      {loading && routes.length === 0 ? <LoadingBlock rows={4} /> : null}

      <Panel className="overflow-hidden p-0">
        <ul className="divide-y divide-ops-card">
          {TUNISIA_GOVERNORATES.map((gov) => {
            const mode = resolvedMode(gov);
            const busy = busyGov === gov;
            return (
              <li
                key={gov}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ops-ink">{gov}</p>
                  <p className="text-xs text-ops-ink/45">
                    Défaut création : {modeLabel(mode)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={mode === "EXTERNAL" ? "info" : "success"}>
                    {modeLabel(mode)}
                  </Badge>
                  <div className="inline-flex rounded-xl border border-ops-card p-0.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setMode(gov, "EXTERNAL")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                        mode === "EXTERNAL"
                          ? "bg-ops-accent text-white"
                          : "text-ops-ink/60 hover:bg-ops-page",
                        busy && "opacity-60",
                      )}
                    >
                      Navex
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void setMode(gov, "INTERNAL")}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                        mode === "INTERNAL"
                          ? "bg-emerald-600 text-white"
                          : "text-ops-ink/60 hover:bg-ops-page",
                        busy && "opacity-60",
                      )}
                    >
                      Umbrella
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
