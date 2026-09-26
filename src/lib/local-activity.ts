import type { AppNotification } from "@/lib/domain";

const STORAGE_KEY = "umbrella.local-activity.v1";
export const LOCAL_ACTIVITY_EVENT = "umbrella:local-activity";

const MAX_ITEMS = 80;

function readAll(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: AppNotification[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new CustomEvent(LOCAL_ACTIVITY_EVENT));
}

export function listLocalActivity(userId?: number): AppNotification[] {
  const all = readAll();
  if (userId == null) return all;
  return all.filter((n) => {
    const uid = (n as AppNotification & { userId?: number }).userId;
    return uid == null || uid === userId;
  });
}

export function pushLocalActivity(input: {
  userId: number;
  title: string;
  body: string;
  kind?: AppNotification["kind"];
  targetId?: number | null;
}): AppNotification {
  const item: AppNotification & { userId: number } = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind ?? "parcel",
    title: input.title,
    body: input.body,
    at: new Date().toISOString(),
    targetId: input.targetId ?? null,
    userId: input.userId,
  };
  const next = [item, ...readAll()].slice(0, MAX_ITEMS);
  writeAll(next);
  return item;
}
