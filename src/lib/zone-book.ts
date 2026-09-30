export type SavedZone = {
  id: string;
  name: string;
  updatedAt: number;
};

const KEY = "umbrella.zone-book.v1";

const SEED: SavedZone[] = [
  { id: "zone-a", name: "Zone A", updatedAt: Date.now() },
  { id: "zone-b", name: "Zone B", updatedAt: Date.now() },
  { id: "zone-c", name: "Zone C", updatedAt: Date.now() },
];

export function loadZoneBook(): SavedZone[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    const parsed = JSON.parse(raw) as SavedZone[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      return [...SEED];
    }
    return parsed
      .filter((z) => z && typeof z.name === "string" && z.name.trim().length >= 2)
      .map((z) => ({
        id: String(z.id),
        name: z.name.trim(),
        updatedAt: Number(z.updatedAt) || Date.now(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  } catch {
    return [...SEED];
  }
}

export function saveZoneBook(list: SavedZone[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function upsertZone(entry: { id?: string; name: string }): SavedZone[] {
  const name = entry.name.trim();
  if (name.length < 2) return loadZoneBook();
  const list = loadZoneBook();
  const existing = entry.id
    ? list.find((z) => z.id === entry.id)
    : list.find((z) => z.name.localeCompare(name, "fr", { sensitivity: "base" }) === 0);
  if (existing) {
    const next = list.map((z) =>
      z.id === existing.id ? { ...z, name, updatedAt: Date.now() } : z,
    );
    saveZoneBook(next);
    return next;
  }
  const created: SavedZone = {
    id: entry.id ?? `zone-${Date.now().toString(36)}`,
    name,
    updatedAt: Date.now(),
  };
  const next = [...list, created].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  saveZoneBook(next);
  return next;
}

export function removeZone(id: string): SavedZone[] {
  const next = loadZoneBook().filter((z) => z.id !== id);
  saveZoneBook(next);
  return next;
}
