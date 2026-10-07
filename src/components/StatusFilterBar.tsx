"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/cn";
import { DASHBOARD_STATUS_KEYS } from "@/lib/dashboard-statuses";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

type Countable = { status: string };

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return hex;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function StatusFilterBar({ parcels }: { parcels: Countable[] }) {
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
    const withCount = DASHBOARD_STATUS_KEYS.filter(
      (key) => (counts.get(key) ?? 0) > 0 || current === key,
    );
    if (current && !withCount.includes(current as StatusKey)) {
      return [...withCount, current as StatusKey];
    }
    return withCount;
  }, [counts, current]);

  function go(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) params.set("status", status);
    else params.delete("status");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label="Filtrer par statut"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      >
        <StatusCard
          label="Tous"
          count={parcels.length}
          active={!current}
          color="#991211"
          onClick={() => go(null)}
          icon={<LayoutGrid className="h-4 w-4" strokeWidth={2.25} />}
        />
        {keys.map((key) => {
          const meta = STATUS_META[key];
          return (
            <StatusCard
              key={key}
              label={meta?.label ?? key}
              count={counts.get(key) ?? 0}
              active={current === key}
              color={meta?.color ?? "#64748b"}
              ink={meta?.ink}
              onClick={() => go(key)}
              icon={
                <span className="text-sm leading-none" aria-hidden>
                  {meta?.emoji ?? "📦"}
                </span>
              }
            />
          );
        })}
      </div>
      {current ? (
        <button
          type="button"
          onClick={() => go(null)}
          className="text-xs font-semibold text-ops-ink/45 hover:text-ops-accent"
        >
          Effacer le filtre
        </button>
      ) : null}
    </div>
  );
}

function StatusCard({
  label,
  count,
  active,
  color,
  ink,
  onClick,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  color: string;
  ink?: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative min-h-[4.5rem] overflow-hidden rounded-2xl border bg-ops-surface px-3 py-2.5 text-left transition",
        "hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active ? "ring-2 ring-ops-accent ring-offset-2 ring-offset-ops-page" : null,
        count === 0 && !active ? "opacity-55" : null,
      )}
      style={{
        borderColor: hexToRgba(color, active ? 0.55 : 0.28),
        boxShadow: active
          ? `0 0 20px ${hexToRgba(color, 0.22)}`
          : `0 0 0 transparent`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: hexToRgba(color, active ? 0.16 : 0.08) }}
        aria-hidden
      />
      <div className="relative flex items-start gap-2.5">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: color, color: ink ?? "#fff" }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold leading-tight text-ops-ink/70">
            {label}
          </span>
          <span className="mt-1 block font-display text-xl font-extrabold leading-none tabular-nums tracking-tight text-ops-ink">
            {count}
          </span>
        </span>
      </div>
    </button>
  );
}
