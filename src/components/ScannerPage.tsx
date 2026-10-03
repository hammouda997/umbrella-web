"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { DashboardHero } from "@/components/DashboardHero";
import { Button, Panel } from "@/components/ui";
import { PORTAL_BY_ROLE, type AppRole } from "@/lib/roles";
import { useAuth } from "@/lib/auth-context";

export function ScannerPage({ role }: { role: AppRole }) {
  const router = useRouter();
  const { session } = useAuth();
  const [code, setCode] = useState("");
  const base = PORTAL_BY_ROLE[role];
  const firstName = session?.user.name?.split(/\s+/)[0] ?? "";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = code.trim();
    if (!q) return;
    if (role === "CLIENT") {
      router.push(`/track?code=${encodeURIComponent(q)}`);
      return;
    }
    router.push(`${base}/parcels?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <div className="lg:hidden">
        <DashboardHero
          subtitle={`Bonjour${firstName ? ` ${firstName}` : ""} — scannez ou saisissez un code.`}
        />
      </div>
      <Panel className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ops-accent/15 text-ops-accent">
            <ScanLine className="h-7 w-7" />
          </span>
          <h1 className="mt-3 font-display text-xl font-bold text-ops-ink">
            Scanner
          </h1>
          <p className="mt-1 text-sm text-ops-ink/50">
            Entrez un n° de colis ou un code-barres pour ouvrir le détail.
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-ops-ink">
            Code colis
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              inputMode="text"
              autoComplete="off"
              placeholder="UMB-…"
              className="mt-1.5 w-full rounded-xl border border-ops-card bg-ops-page px-4 py-3 text-center font-mono text-base outline-none ring-ops-accent focus:ring-2"
            />
          </label>
          <Button type="submit" className="w-full" disabled={!code.trim()}>
            Ouvrir
          </Button>
        </form>
      </Panel>
    </div>
  );
}
