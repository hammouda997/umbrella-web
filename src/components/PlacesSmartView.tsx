"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MapPinned } from "lucide-react";
import { buildTourByPlaces } from "@/lib/tour-planner";
import { Panel } from "@/components/ui";

type PlaceItem = {
  id: number;
  city: string;
  governorate: string;
  status: string;
};

export function PlacesSmartView<T extends PlaceItem>({
  items,
  title = "Vue par lieux",
  description = "Regroupement intelligent par ville / gouvernorat",
  renderItem,
  renderPlaceActions,
}: {
  items: T[];
  title?: string;
  description?: string;
  renderItem: (item: T, indexInPlace: number) => ReactNode;
  renderPlaceActions?: (placeLabel: string, placeItems: T[]) => ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const places = useMemo(
    () => (enabled ? buildTourByPlaces(items) : []),
    [enabled, items],
  );

  return (
    <div className="space-y-4">
      <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <MapPinned className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-bold text-ink">{title}</p>
            <p className="text-sm text-ink-muted">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
            enabled
              ? "border border-cream bg-surface text-ink"
              : "bg-brand text-white hover:bg-brand-soft"
          }`}
        >
          {enabled ? "📋 Liste simple" : "📍 Organiser par lieux"}
        </button>
      </Panel>

      {enabled ? (
        <div className="space-y-5">
          {places.map((place, placeIndex) => (
            <section key={place.placeKey} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand px-4 py-3 text-white">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                    {placeIndex + 1}
                  </span>
                  <div>
                    <p className="font-semibold">📍 {place.placeLabel}</p>
                    <p className="text-xs text-white/80">
                      {place.stops.length} colis
                    </p>
                  </div>
                </div>
                {renderPlaceActions
                  ? renderPlaceActions(place.placeLabel, place.stops)
                  : null}
              </div>
              <div className="space-y-2">
                {place.stops.map((item, i) => (
                  <div key={item.id}>{renderItem(item, i)}</div>
                ))}
              </div>
            </section>
          ))}
          {places.length === 0 ? (
            <p className="text-sm text-ink-muted">Aucun colis à regrouper.</p>
          ) : null}
        </div>
      ) : null}

      {!enabled ? null : null}
    </div>
  );
}
