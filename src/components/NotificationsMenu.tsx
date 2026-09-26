"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, MessageSquareWarning, Package, Wallet } from "lucide-react";
import type { AppNotification, NotificationKind } from "@/lib/domain";
import {
  listLocalActivity,
  LOCAL_ACTIVITY_EVENT,
} from "@/lib/local-activity";
import {
  isNotificationUnread,
  loadNotificationReads,
  persistNotificationReads,
} from "@/lib/notification-reads";
import { cn } from "@/lib/cn";
import type { AppRole } from "@/lib/roles";
import { useApiQuery } from "@/lib/use-api";

const POLL_MS = 60_000;

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  parcel: Package,
  ticket: MessageSquareWarning,
  payment: Wallet,
};

const PARCEL_DETAIL_PORTALS: AppRole[] = ["SUPER_ADMIN", "ADMIN", "EXPEDITEUR"];

function targetHref(item: AppNotification, role: AppRole, prefix: string): string {
  if (item.kind === "ticket") return role === "LIVREUR" ? prefix : `${prefix}/tickets`;
  if (item.kind === "payment") return `${prefix}/payments`;
  if (item.targetId && PARCEL_DETAIL_PORTALS.includes(role)) {
    return `${prefix}/parcels/${item.targetId}`;
  }
  return role === "LIVREUR" ? prefix : `${prefix}/parcels`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationsMenu({
  role,
  userId,
  portalPrefix,
}: {
  role: AppRole;
  userId: number;
  portalPrefix: string;
}) {
  const router = useRouter();
  const { data, loading, reload } = useApiQuery<AppNotification[]>("/notifications");
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [localTick, setLocalTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = loadNotificationReads(userId);
    setSeenAt(stored.seenAt);
    setReadIds(stored.readIds);
  }, [userId]);

  const persist = useCallback(
    (nextSeen: number, nextIds: string[]) => {
      persistNotificationReads(userId, nextSeen, nextIds);
      setSeenAt(nextSeen);
      setReadIds(nextIds);
    },
    [userId],
  );

  useEffect(() => {
    const timer = window.setInterval(() => void reload(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    const bump = () => setLocalTick((n) => n + 1);
    window.addEventListener(LOCAL_ACTIVITY_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(LOCAL_ACTIVITY_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = useMemo(() => {
    const remote = data ?? [];
    const local = listLocalActivity(userId);
    void localTick;
    const byId = new Map<string, AppNotification>();
    for (const n of [...local, ...remote]) byId.set(n.id, n);
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [data, userId, localTick]);

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  const unreadItems = useMemo(
    () => items.filter((n) => isNotificationUnread(n.at, n.id, seenAt, readSet)),
    [items, seenAt, readSet],
  );
  const unread = unreadItems.length;

  const markRead = useCallback(
    (id: string) => {
      if (readSet.has(id)) return;
      persist(seenAt, [id, ...readIds]);
    },
    [persist, readIds, readSet, seenAt],
  );

  const markAllRead = useCallback(() => {
    const nextIds = Array.from(
      new Set([...unreadItems.map((n) => n.id), ...readIds]),
    );
    persist(Date.now(), nextIds);
  }, [persist, readIds, unreadItems]);

  function openItem(item: AppNotification) {
    markRead(item.id);
    setOpen(false);
    router.push(targetHref(item, role, portalPrefix));
  }

  function toggle() {
    setOpen((value) => {
      if (!value) void reload();
      return !value;
    });
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cream text-ink-muted transition hover:border-brand hover:text-brand"
        aria-label={unread ? `Notifications, ${unread} non lues` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-[18px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-cream bg-surface shadow-soft"
        >
          <div className="flex items-center justify-between gap-3 border-b border-cream px-4 py-3">
            <p className="font-display text-sm font-bold text-ink">Notifications</p>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              className="shrink-0 text-xs font-semibold text-brand transition hover:text-brand/80 disabled:text-ink-muted/60"
            >
              Tout marquer comme lu
            </button>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">Chargement…</li>
            ) : null}
            {!loading && items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-ink-muted">
                Aucune notification pour le moment
              </li>
            ) : null}
            {items.map((item) => {
              const kind: NotificationKind = item.kind;
              const Icon = KIND_ICON[kind];
              const isUnread = isNotificationUnread(item.at, item.id, seenAt, readSet);
              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-stretch border-b border-cream/60",
                    isUnread && "bg-brand/[0.04]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => openItem(item)}
                    className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition hover:bg-cream-soft/40"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream-soft text-brand">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">
                          {item.title}
                        </span>
                        {isUnread ? (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-ink-muted/80">
                        {relativeTime(item.at)}
                      </span>
                    </span>
                  </button>
                  {isUnread ? (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="m-2 inline-flex shrink-0 items-center gap-1 self-center rounded-lg px-2 py-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand/10"
                      aria-label={`Marquer « ${item.title} » comme lu`}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Lu
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
