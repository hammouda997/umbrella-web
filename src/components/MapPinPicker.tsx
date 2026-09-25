"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type MapPinPickerProps = {
  lat: number | null;
  lng: number | null;
  onPick: (coords: { lat: number; lng: number }) => void;
  className?: string;
};

const TUNIS_CENTER = { lat: 36.8065, lng: 10.1815 };

export function MapPinPicker({
  lat,
  lng,
  onPick,
  className = "",
}: MapPinPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      const center =
        lat != null && lng != null
          ? { lat, lng }
          : TUNIS_CENTER;

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: lat != null ? 15 : 11,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(
          map,
        );
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current?.getLatLng();
          if (pos) onPickRef.current({ lat: pos.lat, lng: pos.lng });
        });
      }

      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], {
            icon,
            draggable: true,
          }).addTo(map);
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current?.getLatLng();
            if (pos) onPickRef.current({ lat: pos.lat, lng: pos.lng });
          });
        }
        onPickRef.current({ lat: clickLat, lng: clickLng });
      });

      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 80);
    }

    void init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // init once — position updates handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return;
    const map = mapRef.current;
    void import("leaflet").then((L) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.icon({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        markerRef.current = L.marker([lat, lng], {
          icon,
          draggable: true,
        }).addTo(map);
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current?.getLatLng();
          if (pos) onPickRef.current({ lat: pos.lat, lng: pos.lng });
        });
      }
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    });
  }, [lat, lng]);

  return (
    <div className={`overflow-hidden rounded-xl border border-cream-soft ${className}`}>
      <div
        ref={containerRef}
        className="h-52 w-full bg-cream-soft/40 sm:h-64"
        role="application"
        aria-label="Carte pour choisir le point GPS"
      />
      <p className="border-t border-cream-soft bg-surface px-3 py-2 text-[11px] text-ink-muted">
        Touchez la carte ou déplacez le pin pour fixer le point exact.
      </p>
    </div>
  );
}
