"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { StatusCard } from "@/lib/api";
import { cn } from "@/lib/cn";
import { DASHBOARD_STATUS_KEYS } from "@/lib/dashboard-statuses";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

gsap.registerPlugin(useGSAP);

export function StatusBoard({
  items,
  basePath,
}: {
  items: StatusCard[];
  basePath: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const byKey = new Map(items.map((item) => [item.key, item]));
    return DASHBOARD_STATUS_KEYS.map((key) => {
      const found = byKey.get(key);
      return (
        found ?? {
          key,
          label: STATUS_META[key].label,
          tone: "custom",
          count: 0,
        }
      );
    });
  }, [items]);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".status-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.22,
          stagger: 0.02,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    },
    { scope: root, dependencies: [visible] },
  );

  return (
    <nav
      ref={root}
      aria-label="Statuts colis"
      className="rounded-2xl border border-cream bg-surface"
    >
      <ul className="flex gap-1 overflow-x-auto overscroll-x-contain scroll-smooth px-1.5 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:gap-0.5 sm:overflow-visible sm:px-1.5 sm:py-1.5 sm:snap-none md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9">
        {visible.map((item) => {
          const meta = STATUS_META[item.key as StatusKey];
          const href = `${basePath}/parcels?status=${encodeURIComponent(item.key)}`;
          const empty = item.count === 0;
          const emoji = meta?.emoji ?? "📋";
          const label = meta?.label ?? item.label;
          const color = meta?.color ?? "#E5DBD4";
          const ink = meta?.ink ?? "#1A1414";

          return (
            <li key={item.key} className="snap-start w-[8.5rem] shrink-0 sm:w-auto">
              <Link
                href={href}
                className={cn(
                  "status-card flex h-11 items-center gap-2 rounded-xl px-2 pr-2.5 transition sm:h-auto sm:gap-2.5 sm:px-2.5 sm:py-2",
                  "hover:bg-brand/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  empty && "opacity-50",
                )}
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm sm:h-9 sm:w-9 sm:text-base"
                  style={{ backgroundColor: color, color: ink }}
                  aria-hidden
                >
                  {emoji}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-extrabold leading-none tabular-nums text-brand sm:text-lg">
                    {item.count}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-semibold leading-tight text-ink sm:text-[11px]">
                    {label}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
