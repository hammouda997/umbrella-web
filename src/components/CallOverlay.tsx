"use client";

import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui";
import type { CommsPerson } from "@/lib/comms-types";
import { cn } from "@/lib/cn";

export function CallOverlay({
  phase,
  peer,
  muted,
  onAccept,
  onReject,
  onHangup,
  onToggleMute,
}: {
  phase: "idle" | "outgoing" | "incoming" | "active";
  peer?: CommsPerson | null;
  muted: boolean;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
}) {
  if (phase === "idle") return null;

  const title =
    phase === "incoming"
      ? "Appel entrant"
      : phase === "outgoing"
        ? "Appel en cours…"
        : "En communication";

  return (
    <div className="fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-md rounded-2xl border border-ops-card bg-ops-surface p-4 shadow-ops",
          phase === "incoming" && "ring-2 ring-ops-accent/40",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ops-ink/45">
          {title}
        </p>
        <p className="mt-1 font-display text-lg font-bold text-ops-ink">
          {peer?.name ?? "Contact"}
        </p>
        <p className="text-xs text-ops-ink/50">{peer?.role}</p>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {phase === "incoming" ? (
            <>
              <Button variant="secondary" icon={PhoneOff} onClick={onReject}>
                Refuser
              </Button>
              <Button variant="primary" icon={Phone} onClick={onAccept}>
                Accepter
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                icon={muted ? MicOff : Mic}
                onClick={onToggleMute}
              >
                {muted ? "Micro off" : "Micro"}
              </Button>
              <Button variant="danger" icon={PhoneOff} onClick={onHangup}>
                Raccrocher
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
