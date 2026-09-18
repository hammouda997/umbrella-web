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
  T extends { id: number; city: string; governorate: string; status: string },
>(parcels: T[]): PlaceStop<T>[] {
  const map = new Map<string, PlaceStop<T>>();

  for (const parcel of parcels) {
    const key = placeKey(parcel.city, parcel.governorate);
    const existing = map.get(key);
    if (existing) {
      existing.stops.push(parcel);
      continue;
    }
    map.set(key, {
      placeKey: key,
      placeLabel: `${parcel.city}, ${parcel.governorate}`,
      governorate: parcel.governorate,
      city: parcel.city,
      stops: [parcel],
    });
  }

  const places = Array.from(map.values());

  places.sort((a, b) => {
    const sa = PLACE_PRIORITY[a.governorate] ?? 50;
    const sb = PLACE_PRIORITY[b.governorate] ?? 50;
    if (sa !== sb) return sa - sb;
    return a.city.localeCompare(b.city, "fr");
  });

  for (const place of places) {
    place.stops.sort((a, b) => {
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
  stops: Array<{ address: string; city: string }>,
): string | null {
  if (stops.length === 0) return null;
  const points = stops.map(
    (s) => `${s.address}, ${s.city}, Tunisie`,
  );
  if (points.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(points[0])}`;
  }
  const origin = encodeURIComponent(points[0]);
  const destination = encodeURIComponent(points[points.length - 1]);
  const waypoints = points
    .slice(1, -1)
    .map((p) => encodeURIComponent(p))
    .join("|");
  const wp = waypoints ? `&waypoints=${waypoints}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${wp}&travelmode=driving`;
}
