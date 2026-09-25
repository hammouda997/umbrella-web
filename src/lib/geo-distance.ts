export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Rough city centroids for near-me when parcel has no lat/lng */
export const cityCentroids: Record<string, { lat: number; lng: number }> = {
  Tunis: { lat: 36.8065, lng: 10.1815 },
  Ariana: { lat: 36.8625, lng: 10.1956 },
  "Ben Arous": { lat: 36.7531, lng: 10.2189 },
  Ben_Arous: { lat: 36.7531, lng: 10.2189 },
  "La Marsa": { lat: 36.8764, lng: 10.3253 },
  Carthage: { lat: 36.8589, lng: 10.3222 },
  Sousse: { lat: 35.8256, lng: 10.6411 },
  Sfax: { lat: 34.7398, lng: 10.76 },
  Bizerte: { lat: 37.2744, lng: 9.8739 },
  Nabeul: { lat: 36.4561, lng: 10.7376 },
  Hammamet: { lat: 36.4, lng: 10.6167 },
  Monastir: { lat: 35.7772, lng: 10.8262 },
  Kairouan: { lat: 35.6781, lng: 10.0963 },
  Gabes: { lat: 33.8815, lng: 10.0982 },
  Gafsa: { lat: 34.425, lng: 8.7842 },
  Medenine: { lat: 33.3549, lng: 10.5055 },
  "Le Bardo": { lat: 36.8092, lng: 10.1372 },
  Ezzahra: { lat: 36.7392, lng: 10.3081 },
  "Ariana Ville": { lat: 36.8625, lng: 10.1956 },
};

export function estimateParcelCoords(input: {
  lat?: number | null;
  lng?: number | null;
  city?: string;
  governorate?: string;
}): { lat: number; lng: number } | null {
  if (input.lat != null && input.lng != null) {
    return { lat: input.lat, lng: input.lng };
  }
  if (input.city && cityCentroids[input.city]) return cityCentroids[input.city];
  if (input.governorate && cityCentroids[input.governorate]) {
    return cityCentroids[input.governorate];
  }
  return null;
}

export function sortByDistanceFrom<T>(
  items: T[],
  origin: { lat: number; lng: number },
  getCoords: (item: T) => { lat: number; lng: number } | null,
): Array<T & { distanceKm: number | null }> {
  return items
    .map((item) => {
      const coords = getCoords(item);
      return {
        ...item,
        distanceKm: coords ? haversineKm(origin, coords) : null,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
