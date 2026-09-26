const MAX_IDS = 200;

function idsKey(userId: number): string {
  return `umbrella.notifications.read.${userId}`;
}

function seenKey(userId: number): string {
  return `umbrella.notifications.seen.${userId}`;
}

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function loadNotificationReads(userId: number): {
  seenAt: number;
  readIds: string[];
} {
  if (typeof window === "undefined") {
    return { seenAt: 0, readIds: [] };
  }
  return {
    seenAt: Number(window.localStorage.getItem(seenKey(userId)) ?? 0),
    readIds: parseIds(window.localStorage.getItem(idsKey(userId))),
  };
}

export function persistNotificationReads(
  userId: number,
  seenAt: number,
  readIds: string[],
) {
  window.localStorage.setItem(seenKey(userId), String(seenAt));
  window.localStorage.setItem(
    idsKey(userId),
    JSON.stringify(readIds.slice(0, MAX_IDS)),
  );
}

export function isNotificationUnread(
  at: string,
  id: string,
  seenAt: number,
  readIds: ReadonlySet<string>,
): boolean {
  if (readIds.has(id)) return false;
  return new Date(at).getTime() > seenAt;
}
