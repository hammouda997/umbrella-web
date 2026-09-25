import {
  displayGovernorate,
  normalizeSearch,
} from "@/lib/normalize-text";
import {
  getCachedPlaceSearch,
  setCachedPlaceSearch,
} from "@/lib/place-search-cache";
import { governoratesWithCities } from "@/lib/tunisia-address";

export type AddressSuggestion = {
  id: string;
  label: string;
  governorate: string;
  city: string;
  locality?: string;
  street?: string;
  lat?: number;
  lng?: number;
  source: "local" | "photon" | "cache";
};

const TN_BBOX = "7.5,30.2,11.65,37.55";
const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE = "https://photon.komoot.io/reverse";

const GOV_ALIASES: Record<string, string> = {
  tunis: "Tunis",
  ariana: "Ariana",
  beja: "Beja",
  "ben arous": "Ben_Arous",
  bizerte: "Bizerte",
  gabes: "Gabes",
  gafsa: "Gafsa",
  jendouba: "Jendouba",
  kairouan: "Kairouan",
  kasserine: "Kasserine",
  kebili: "Kebili",
  "le kef": "Le_Kef",
  kef: "Le_Kef",
  mahdia: "Mahdia",
  "la manouba": "La_Manouba",
  manouba: "La_Manouba",
  medenine: "Medenine",
  monastir: "Monastir",
  nabeul: "Nabeul",
  sfax: "Sfax",
  "sidi bouzid": "Sidi_Bouzid",
  siliana: "Siliana",
  sousse: "Sousse",
  tataouine: "Tataouine",
  tozeur: "Tozeur",
  zaghouan: "Zaghouan",
};

function scoreMatch(haystack: string, needle: string): number {
  const h = normalizeSearch(haystack);
  const n = normalizeSearch(needle);
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 90;
  if (h.includes(` ${n}`)) return 80;
  if (h.includes(n)) return 70;
  const tokens = n.split(" ").filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => h.includes(t))) return 60;
  return 0;
}

export function matchGovernorateKey(raw: string): string | null {
  const n = normalizeSearch(raw);
  if (!n) return null;
  if (GOV_ALIASES[n]) return GOV_ALIASES[n];
  for (const key of Object.keys(governoratesWithCities)) {
    if (normalizeSearch(displayGovernorate(key)) === n) return key;
    if (normalizeSearch(key) === n) return key;
  }
  for (const [alias, key] of Object.entries(GOV_ALIASES)) {
    if (n.includes(alias) || alias.includes(n)) return key;
  }
  return null;
}

export function fuzzyFilterOptions(
  options: string[],
  query: string,
  limit = 40,
): string[] {
  const q = normalizeSearch(query);
  if (!q) return options.slice(0, limit);

  return options
    .map((opt) => ({ opt, score: scoreMatch(opt, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.opt.localeCompare(b.opt, "fr"))
    .slice(0, limit)
    .map((x) => x.opt);
}

export function searchLocalPlaces(query: string, limit = 12): AddressSuggestion[] {
  const q = normalizeSearch(query);
  if (q.length < 2) return [];

  const hits: Array<AddressSuggestion & { score: number }> = [];

  for (const [gov, cities] of Object.entries(governoratesWithCities)) {
    const govLabel = displayGovernorate(gov);
    const govScore = scoreMatch(govLabel, q);
    if (govScore >= 70) {
      hits.push({
        id: `gov-${gov}`,
        label: govLabel,
        governorate: gov,
        city: cities[0] ?? govLabel,
        source: "local",
        score: govScore,
      });
    }
    for (const city of cities) {
      const cityScore = scoreMatch(city, q);
      const comboScore = scoreMatch(`${city} ${govLabel}`, q);
      const score = Math.max(cityScore, comboScore);
      if (score >= 60) {
        hits.push({
          id: `city-${gov}-${city}`,
          label: `${city}, ${govLabel}`,
          governorate: gov,
          city,
          source: "local",
          score,
        });
      }
    }
  }

  return hits
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "fr"))
    .slice(0, limit)
    .map(({ score: _s, ...rest }) => rest);
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number | string;
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    locality?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
};

function mapPhotonFeature(f: PhotonFeature, index: number): AddressSuggestion | null {
  const p = f.properties ?? {};
  const cc = (p.countrycode ?? "").toLowerCase();
  if (cc && cc !== "tn") return null;

  const state = p.state ?? p.county ?? "";
  const governorate = matchGovernorateKey(state) ?? matchGovernorateKey(p.city ?? "");
  if (!governorate) return null;

  const city =
    p.city ??
    p.locality ??
    p.district ??
    governoratesWithCities[governorate]?.[0] ??
    displayGovernorate(governorate);

  const streetParts = [p.housenumber, p.street ?? p.name].filter(Boolean);
  const street = streetParts.join(" ").trim();
  const locality = p.locality ?? p.district ?? undefined;
  const label = [street || p.name, city, displayGovernorate(governorate)]
    .filter(Boolean)
    .join(", ");

  const [lng, lat] = f.geometry?.coordinates ?? [];

  return {
    id: `photon-${p.osm_id ?? index}-${normalizeSearch(label)}`,
    label,
    governorate,
    city,
    locality,
    street: street || undefined,
    lat: typeof lat === "number" ? lat : undefined,
    lng: typeof lng === "number" ? lng : undefined,
    source: "photon",
  };
}

export async function searchPhotonTunisia(
  query: string,
  limit = 8,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "fr");
  url.searchParams.set("bbox", TN_BBOX);
  url.searchParams.set("lat", "36.8065");
  url.searchParams.set("lon", "10.1815");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return [];
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const mapped = (data.features ?? [])
    .map((f, i) => mapPhotonFeature(f, i))
    .filter((x): x is AddressSuggestion => x != null);

  const dedup = new Map<string, AddressSuggestion>();
  for (const item of mapped) {
    if (!dedup.has(item.label)) dedup.set(item.label, item);
  }
  return Array.from(dedup.values()).slice(0, limit);
}

export async function reverseGeocodeTunisia(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AddressSuggestion | null> {
  const url = new URL(PHOTON_REVERSE);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("lang", "fr");

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const feature = data.features?.[0];
  if (!feature) return null;
  const mapped = mapPhotonFeature(feature, 0);
  if (!mapped) return null;
  return {
    ...mapped,
    lat,
    lng,
  };
}

export async function searchPlacesCombined(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const local = searchLocalPlaces(query, 8);
  const cached = getCachedPlaceSearch(query).map((h) => ({
    ...h,
    source: "cache" as const,
  }));

  let remote: AddressSuggestion[] = [];
  try {
    remote = await searchPhotonTunisia(query, 8, signal);
    if (remote.length > 0) setCachedPlaceSearch(query, remote);
  } catch {
    remote = cached.length > 0 ? cached : [];
  }

  if (remote.length === 0 && cached.length > 0) {
    remote = cached;
  }

  const seen = new Set(local.map((x) => normalizeSearch(x.label)));
  const merged = [...local];
  for (const item of remote) {
    const key = normalizeSearch(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 14);
}
