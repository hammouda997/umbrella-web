"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { DASHBOARD_STATUS_KEYS } from "@/lib/dashboard-statuses";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

type Countable = { status: string };

export function StatusFilterBar({
  parcels,
}: {
  parcels: Countable[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("status");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const parcel of parcels) {
      map.set(parcel.status, (map.get(parcel.status) ?? 0) + 1);
    }
    return map;
  }, [parcels]);

  const keys = useMemo(() => {
    if (current && !DASHBOARD_STATUS_KEYS.includes(current as StatusKey)) {
      return [...DASHBOARD_STATUS_KEYS, current as StatusKey];
    }
    return DASHBOARD_STATUS_KEYS;
  }, [current]);

  function go(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set("status", status);
    else params.delete("status");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <nav
      aria-label="Filtrer par statut"
      className="flex flex-wrap gap-1.5"
    >
      <FilterChip
        label="Tous"
        count={parcels.length}
        active={!current}
        onClick={() => go(null)}
      />
      {keys.map((key) => {
        const meta = STATUS_META[key];
        return (
          <FilterChip
            key={key}
            label={meta?.label ?? key}
            count={counts.get(key) ?? 0}
            color={meta?.color}
            active={current === key}
            onClick={() => go(key)}
          />
        );
      })}
    </nav>
  );
}

function FilterChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-brand bg-brand text-white"
          : "border-cream bg-surface text-ink hover:border-brand/40",
      )}
    >
      {color ? (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ) : null}
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums",
          active ? "text-white/80" : "text-ink-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}
