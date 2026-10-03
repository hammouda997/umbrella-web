"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MobileOpsDashboard } from "@/components/MobileOpsDashboard";
import { OpsDashboardLoader } from "@/components/OpsDashboardLoader";
import { apiFetch, type StatusCard } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildOpsStatusKpis } from "@/lib/ops-status-kpis";

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
  const [statusCards, setStatusCards] = useState<StatusCard[]>([]);
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
      .then(([counts, stats, list]) => {
        setStatusCards(counts);
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

  const statusKpis = useMemo(() => {
    const countsByStatus = new Map(
      statusCards.map((card) => [card.key, card.count] as const),
    );
    return buildOpsStatusKpis({
      basePath,
      countsByStatus,
      totalLabel: isSender ? "Mes colis" : "Total",
      totalCount: analytics?.kpis.total,
    });
  }, [analytics?.kpis.total, basePath, isSender, statusCards]);

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
          kpis={statusKpis}
          revenue={kpis.revenue}
          solde={analytics?.soldes?.disponible ?? 0}
          inProgress={kpis.inProgress}
          delivered={kpis.delivered}
          deliveryRate={kpis.deliveryRate}
          performanceParcels={parcels}
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
