"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { StatusCard } from "@/lib/api";
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

  useGSAP(
    () => {
      const pills = gsap.utils.toArray<HTMLElement>(".status-pill");
      gsap.fromTo(
        pills,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          stagger: 0.018,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    },
    { scope: root, dependencies: [items] },
  );

  return (
    <div
      ref={root}
      className="flex flex-wrap gap-2"
      role="navigation"
      aria-label="Statuts colis"
    >
      {items.map((item) => {
        const meta = STATUS_META[item.key as StatusKey];
        const href = `${basePath}/parcels?status=${encodeURIComponent(item.key)}`;
        const empty = item.count === 0;
        const emoji = meta?.emoji ?? "📋";
        const label = meta?.label ?? item.label;

        return (
          <Link
            key={item.key}
            href={href}
            className={`status-pill inline-flex max-w-full items-center gap-2 rounded-full border border-cream bg-surface px-3 py-2 text-sm transition hover:border-brand/35 hover:bg-brand/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              empty ? "opacity-55" : ""
            }`}
          >
            <span className="text-[15px] leading-none" aria-hidden>
              {emoji}
            </span>
            <span className="font-display text-sm font-extrabold tabular-nums text-brand">
              {item.count}
            </span>
            <span className="truncate text-[12px] font-semibold text-ink">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
