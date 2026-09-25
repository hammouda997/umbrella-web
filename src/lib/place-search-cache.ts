import type { AddressSuggestion } from "@/lib/location-search";

const CACHE_KEY = "umbrella.photon.cache.v1";
const MAX_ENTRIES = 80;

type CacheEntry = {
  q: string;
  at: number;
  hits: AddressSuggestion[];
};

function readAll(): CacheEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CacheEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: CacheEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // quota / private mode
  }
}

export function getCachedPlaceSearch(query: string): AddressSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const all = readAll();
  const exact = all.find((e) => e.q === q);
  if (exact) return exact.hits;
  const prefix = all.find((e) => e.q.startsWith(q) || q.startsWith(e.q));
  return prefix?.hits ?? [];
}

export function setCachedPlaceSearch(query: string, hits: AddressSuggestion[]) {
  const q = query.trim().toLowerCase();
  if (q.length < 2 || hits.length === 0) return;
  const next = [
    { q, at: Date.now(), hits },
    ...readAll().filter((e) => e.q !== q),
  ];
  writeAll(next);
}
