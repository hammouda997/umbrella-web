import { estimateParcelCoords, haversineKm } from "@/lib/geo-distance";

export type PlaceStop<T extends { city: string; governorate: string; status: string; id: number }> = {
  placeKey: string;
  placeLabel: string;
  governorate: string;
  city: string;
  stops: T[];
};

const PLACE_PRIORITY: Record<string, number> = {
  Tunis: 1,
  Ariana: 2,
  "Ben Arous": 3,
  "La Mannouba": 4,
  Nabeul: 5,
  Bizerte: 6,
  Sousse: 7,
  Monastir: 8,
  Mahdia: 9,
  Sfax: 10,
};

const STATUS_PRIORITY: Record<string, number> = {
  EN_COURS: 0,
  A_VERIFIER: 1,
  A_ENLEVER: 2,
  ENLEVES: 3,
  AU_DEPOT: 4,
  EN_ATTENTE: 5,
};

function placeKey(city: string, governorate: string) {
  return `${governorate}||${city}`.toLowerCase();
}

/**
 * Smart tour: cluster parcels by place (ville + gouvernorat),
 * order places for a sensible Greater Tunis → coast → south path,
 * and prioritize "en cours" stops inside each place.
 */
export function buildTourByPlaces<
  T extends {
    id: number;
    city: string;
    governorate: string;
    status: string;
    lat?: number | null;
    lng?: number | null;
  },
>(
  parcels: T[],
  origin?: { lat: number; lng: number } | null,
): PlaceStop<T>[] {
  const map = new Map<string, PlaceStop<T>>();

  for (const parcel of parcels) {
    const key = placeKey(parcel.city, parcel.governorate);
    const existing = map.get(key);
    if (existing) {
      existing.stops.push(parcel);
    } else {
      map.set(key, {
        placeKey: key,
        placeLabel: `${parcel.city}, ${parcel.governorate}`,
        governorate: parcel.governorate,
        city: parcel.city,
        stops: [parcel],
      });
    }
  }

  const places = Array.from(map.values());

  if (origin) {
    places.sort((a, b) => {
      const ca = estimateParcelCoords({
        city: a.city,
        governorate: a.governorate,
        lat: a.stops[0]?.lat,
        lng: a.stops[0]?.lng,
      });
      const cb = estimateParcelCoords({
        city: b.city,
        governorate: b.governorate,
        lat: b.stops[0]?.lat,
        lng: b.stops[0]?.lng,
      });
      const da = ca ? haversineKm(origin, ca) : Number.POSITIVE_INFINITY;
      const db = cb ? haversineKm(origin, cb) : Number.POSITIVE_INFINITY;
      return da - db;
    });
  } else {
    places.sort((a, b) => {
      const sa = PLACE_PRIORITY[a.governorate] ?? 50;
      const sb = PLACE_PRIORITY[b.governorate] ?? 50;
      if (sa !== sb) return sa - sb;
      return a.city.localeCompare(b.city, "fr");
    });
  }

  for (const place of places) {
    place.stops.sort((a, b) => {
      if (origin) {
        const ca = estimateParcelCoords({
          city: a.city,
          governorate: a.governorate,
          lat: a.lat,
          lng: a.lng,
        });
        const cb = estimateParcelCoords({
          city: b.city,
          governorate: b.governorate,
          lat: b.lat,
          lng: b.lng,
        });
        const da = ca ? haversineKm(origin, ca) : Number.POSITIVE_INFINITY;
        const db = cb ? haversineKm(origin, cb) : Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;
      }
      const pa = STATUS_PRIORITY[a.status] ?? 20;
      const pb = STATUS_PRIORITY[b.status] ?? 20;
      if (pa !== pb) return pa - pb;
      return a.id - b.id;
    });
  }

  return places;
}

export function flattenTourStops<
  T extends { city: string; governorate: string; status: string; id: number },
>(places: PlaceStop<T>[]): T[] {
  return places.flatMap((p) => p.stops);
}

export function googleMapsTourUrl(
  stops: Array<{ address: string; city: string; governorate?: string }>,
  origin?: { lat: number; lng: number } | null,
): string | null {
  if (stops.length === 0) return null;
  const points = stops.map((s) => {
    const gov = s.governorate ? `, ${s.governorate.replace(/_/g, " ")}` : "";
    return `${s.address}, ${s.city}${gov}, Tunisie`;
  });

  if (points.length === 1 && !origin) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(points[0])}`;
  }

  const originParam = origin
    ? `${origin.lat},${origin.lng}`
    : points[0];
  const destination = points[points.length - 1];
  const middle = origin ? points.slice(0, -1) : points.slice(1, -1);
  const waypoints = middle.map((p) => encodeURIComponent(p)).join("|");
  const wp = waypoints ? `&waypoints=${waypoints}` : "";

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destination)}${wp}&travelmode=driving`;
}
