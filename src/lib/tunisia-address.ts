import adminTree from "@/data/tunisia-admin.json";
import { normalizeSearch } from "@/lib/normalize-text";

type AdminTree = Record<string, Record<string, string[]>>;

const TREE = adminTree as AdminTree;

export const governoratesWithCities: Record<string, string[]> = Object.fromEntries(
  Object.entries(TREE).map(([gov, cities]) => [
    gov,
    Object.keys(cities).sort((a, b) => a.localeCompare(b, "fr")),
  ]),
);

const CITY_ALIASES: Record<string, string> = {
  "ksour essaf": "Ksour Essef",
  "ksour es saf": "Ksour Essef",
  "ksour essef": "Ksour Essef",
  "el jemem": "El Jem",
  "el jemm": "El Jem",
  "el jem": "El Jem",
  "bou merzoug": "Boumerdès",
  "bou merdes": "Boumerdès",
  "boumerdes": "Boumerdès",
  melloulech: "Melloulèche",
  mellouleche: "Melloulèche",
  "la chebba": "Chebba",
  souassi: "Essouassi",
  essouassi: "Essouassi",
  hbira: "Hebira",
  "h bira": "Hebira",
  hebira: "Hebira",
  ariana: "Ariana Médina",
  "ariana ville": "Ariana Médina",
  "ariana medina": "Ariana Médina",
  "la soukra": "Soukra",
  soukra: "Soukra",
  "ben arous ville": "Ben Arous",
  boumhel: "Bou Mhel El Bassatine",
  "el mourouj 1": "El Mourouj",
  "el mourouj 3": "El Mourouj",
  rades: "Radès",
  manouba: "La Manouba",
  "la manouba": "La Manouba",
  jedaida: "Jedaida",
  sfax: "Sfax Médina",
  "sfax ville": "Sfax Médina",
  "sfax medina": "Sfax Médina",
  sousse: "Sousse Médina",
  "sousse medina": "Sousse Médina",
  "sousse jawhara": "Sousse Jaouhara",
  "sousse jaouhara": "Sousse Jaouhara",
  msaken: "M'Saken",
  "m saken": "M'Saken",
  "kalaa kebira": "Kalaa Kebira",
  "kalaa sghira": "Kalaa Sghira",
  gammarth: "Soukra",
  "berges du lac": "Soukra",
  "le bardo": "Bardo",
  bardo: "Bardo",
  "el omrane": "Omrane",
  omrane: "Omrane",
  "el omrane superieur": "Omrane Supérieur",
  ettahrir: "El Tahrir",
  "el tahrir": "El Tahrir",
  hrairia: "Hrairia",
  "el hrairia": "Hrairia",
  kabaria: "Kabaria",
  "el kabaria": "Kabaria",
  "djebel jelloud": "Jebel Jelloud",
  "jebel jelloud": "Jebel Jelloud",
  "houmt souk": "Houmt Souk",
  "djerba houmet souk": "Houmt Souk",
  "djerba houmet essouk": "Houmt Souk",
  "djerba midoun": "Djerba Midoun",
  midoun: "Djerba Midoun",
  "djerba ajim": "Djerba Ajim",
  ajim: "Djerba Ajim",
};

export function citiesForGovernorate(governorate: string): string[] {
  return governoratesWithCities[governorate] ?? [];
}

export function resolveOfficialCity(
  governorate: string,
  raw: string,
): string | null {
  const cities = citiesForGovernorate(governorate);
  const n = normalizeSearch(raw);
  if (!n) return null;

  const aliased = CITY_ALIASES[n];
  if (aliased) {
    const hit = cities.find((city) => normalizeSearch(city) === normalizeSearch(aliased));
    if (hit) return hit;
  }

  for (const city of cities) {
    if (normalizeSearch(city) === n) return city;
  }

  if (n.length >= 4) {
    for (const city of cities) {
      const cn = normalizeSearch(city);
      if (cn.startsWith(n) || n.startsWith(cn)) return city;
    }
  }

  return null;
}
