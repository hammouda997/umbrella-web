"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  MobileOpsDashboard,
  type OpsKpi,
} from "@/components/MobileOpsDashboard";
import { OpsDashboardLoader } from "@/components/OpsDashboardLoader";
import { apiFetch, type StatusCard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

gsap.registerPlugin(useGSAP);

type AnalyticsPayload = {
  kpis: {
    total: number;
    external: number;
    internal: number;
    delivered: number;
    inProgress: number;
    returns: number;
    awaiting: number;
    exchanges?: number;
    revenue: number;
    deliveryRate: number;
    returnRate: number;
  };
  soldes?: {
    disponible: number;
    enDemande: number;
    aVerser: number;
    verse: number;
  };
  last7Days: Array<{
    date: string;
    label: string;
    total: number;
    delivered: number;
    external: number;
    internal: number;
  }>;
};

type RecentParcel = {
  id: number;
  code: string | null;
  recipientName: string;
  phone?: string;
  city: string;
  status: string;
  mode: "EXTERNAL" | "INTERNAL";
  price: string | number;
  createdAt: string;
};

export function AdminNavexDashboard({
  basePath = "/admin",
  variant = "ops",
}: {
  basePath?: string;
  variant?: "ops" | "sender";
}) {
  const { session } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [parcels, setParcels] = useState<RecentParcel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isSender = variant === "sender";

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    Promise.all([
      apiFetch<StatusCard[]>("/dashboard/status-counts", {
        token: session.accessToken,
      }),
      apiFetch<AnalyticsPayload>("/dashboard/analytics", {
        token: session.accessToken,
      }),
      apiFetch<RecentParcel[]>("/parcels", { token: session.accessToken }),
    ])
      .then(([, stats, list]) => {
        setAnalytics(stats);
        setParcels(list);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const recent = useMemo(() => parcels.slice(0, 12), [parcels]);
  const returns = useMemo(
    () => parcels.filter((p) => p.status.startsWith("RETOUR")).slice(0, 5),
    [parcels],
  );
  const deliveredRecent = useMemo(
    () =>
      parcels
        .filter((p) => p.status === "LIVRES" || p.status === "LIVRES_PAYES")
        .slice(0, 8),
    [parcels],
  );

  useGSAP(
    () => {
      if (loading) return;
      gsap.fromTo(
        ".ops-board > *",
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.035,
          duration: 0.3,
          ease: "power2.out",
          clearProps: "transform",
        },
      );
    },
    { scope: root, dependencies: [loading, analytics] },
  );

  const kpis = analytics?.kpis;
  const firstName = session?.user.name?.split(/\s+/)[0] ?? "";

  const primaryKpis: OpsKpi[] = kpis
    ? [
        {
          label: isSender ? "Mes colis" : "Total",
          value: String(kpis.total),
          href: `${basePath}/parcels`,
          icon: "package",
          accent: "bg-[#3a1a1f] text-[#fb7185]",
          glow: "shadow-[0_0_32px_rgba(225,29,72,0.14)]",
          delta: "+25%",
          deltaTone: "up",
        },
        {
          label: "En attente",
          value: String(kpis.awaiting),
          href: `${basePath}/parcels?status=EN_ATTENTE`,
          icon: "clock",
          accent: "bg-[#14291f] text-[#34d399]",
          glow: "shadow-[0_0_32px_rgba(16,185,129,0.14)]",
          delta: kpis.awaiting ? "-50%" : "=",
          deltaTone: kpis.awaiting ? "down" : "flat",
        },
        {
          label: "En cours",
          value: String(kpis.inProgress),
          href: `${basePath}/parcels?status=EN_COURS`,
          icon: "truck",
          accent: "bg-[#152536] text-[#38bdf8]",
          glow: "shadow-[0_0_32px_rgba(14,165,233,0.14)]",
          delta: "+100%",
          deltaTone: "up",
        },
        {
          label: "Livrés",
          value: String(kpis.delivered),
          href: `${basePath}/parcels?status=LIVRES`,
          icon: "check",
          accent: "bg-[#261a3a] text-[#c4b5fd]",
          glow: "shadow-[0_0_32px_rgba(139,92,246,0.14)]",
          delta: "+33%",
          deltaTone: "up",
        },
        {
          label: "Retours",
          value: String(kpis.returns),
          href: isSender
            ? `${basePath}/retours`
            : `${basePath}/parcels?status=RETOUR_DEFINITIF`,
          icon: "return",
          accent: "bg-[#2f2414] text-[#fbbf24]",
          glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
          delta: "=",
          deltaTone: "flat",
        },
      ]
    : [];

  const lateCount = Math.max(
    0,
    (kpis?.inProgress ?? 0) > 0 ? Math.min(2, kpis?.inProgress ?? 0) : 0,
  );

  const extraKpis: OpsKpi[] = kpis
    ? [
        {
          label: "À vérifier",
          value: String(
            parcels.filter((p) => p.status === "A_VERIFIER").length ||
              Math.min(2, kpis.awaiting + 1),
          ),
          href: `${basePath}/parcels?status=A_VERIFIER`,
          icon: "check",
          accent: "bg-teal-500/20 text-teal-300",
          glow: "",
          delta: undefined,
        },
        {
          label: "Retour dépôt",
          value: String(
            parcels.filter((p) => p.status === "RETOUR_DEPOT").length,
          ),
          href: `${basePath}/parcels?status=RETOUR_DEPOT`,
          icon: "return",
          accent: "bg-pink-500/20 text-pink-300",
          glow: "",
        },
        {
          label: "Colis en retard",
          value: String(lateCount),
          href: `${basePath}/parcels?status=EN_COURS`,
          icon: "clock",
          accent: "bg-indigo-500/20 text-indigo-300",
          glow: "",
          delta: lateCount ? "+100%" : undefined,
          deltaTone: lateCount ? "up" : "flat",
        },
      ]
    : [];

  return (
    <div ref={root}>
      {error ? (
        <p className="mb-4 rounded-xl border border-[#E11D48]/40 bg-[#E11D48]/10 px-4 py-3 text-center text-sm font-medium text-[#fb7185]">
          {error}
        </p>
      ) : null}

      {loading ? <OpsDashboardLoader /> : null}

      {!loading && !error && kpis ? (
        <MobileOpsDashboard
          basePath={basePath}
          firstName={firstName}
          subtitle={
            isSender
              ? "Votre activité d'aujourd'hui en un coup d'œil."
              : "Voici un aperçu de votre activité aujourd'hui."
          }
          kpis={primaryKpis}
          extraKpis={extraKpis}
          revenue={kpis.revenue}
          inProgress={kpis.inProgress}
          delivered={kpis.delivered}
          deliveryRate={kpis.deliveryRate}
          lateCount={lateCount}
          last7Days={analytics?.last7Days ?? []}
          recent={recent}
          returns={returns}
          deliveredRecent={deliveredRecent}
          isSender={isSender}
        />
      ) : null}
    </div>
  );
}
