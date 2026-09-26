import adminTree from "@/data/tunisia-admin.json";
import { normalizeSearch } from "@/lib/normalize-text";
import {
  citiesForGovernorate,
  resolveOfficialCity,
} from "@/lib/tunisia-address";

type AdminTree = Record<string, Record<string, string[]>>;

const TREE = adminTree as AdminTree;

const LOCALITY_EXTRAS: Record<string, string[]> = {
  "Ariana::Ariana Médina": ["Cité Ennasr 1", "Cité Ennasr 2", "Riadh Andalous", "Borj Louzir"],
  "Ariana::Soukra": ["Chotrana", "Gammarth Supérieur", "Aéroport", "Borj El Baccouche"],
  "Tunis::La Marsa": ["Gammarth", "Sidi Bou Saïd"],
  "Sousse::Hammam Sousse": ["Port El Kantaoui", "Chott Mariem"],
  "Nabeul::Hammamet": ["Yasmine Hammamet", "Hammamet Sud", "Hammamet Nord"],
  "Monastir::Sahline": ["Aéroport Monastir", "Sahline Plage"],
};

function localityKey(governorate: string, city: string): string {
  return `${governorate}::${city}`;
}

function uniqueSorted(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = normalizeSearch(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out.sort((a, b) => a.localeCompare(b, "fr"));
}

export function localitiesForCity(
  governorate: string,
  city: string,
): string[] {
  if (!governorate) return [];
  const official = city ? resolveOfficialCity(governorate, city) : null;
  const name = official ?? city.trim();
  if (!name) return citiesForGovernorate(governorate);

  const sectors = TREE[governorate]?.[name] ?? [];
  const extras = LOCALITY_EXTRAS[localityKey(governorate, name)] ?? [];

  if (sectors.length === 0 && extras.length === 0) {
    for (const [key, list] of Object.entries(TREE[governorate] ?? {})) {
      if (normalizeSearch(key) === normalizeSearch(name)) {
        return uniqueSorted([...list, ...(LOCALITY_EXTRAS[localityKey(governorate, key)] ?? [])]);
      }
    }
    return [name];
  }

  return uniqueSorted([...sectors, ...extras, name]);
}
