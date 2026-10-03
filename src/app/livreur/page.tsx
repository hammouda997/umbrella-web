"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileOpsDashboard } from "@/components/MobileOpsDashboard";
import { OpsDashboardLoader } from "@/components/OpsDashboardLoader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { buildOpsStatusKpis, countByStatus } from "@/lib/ops-status-kpis";

type ParcelRow = {
  id: number;
  code: string | null;
  recipientName: string;
  city: string;
  status: string;
  price: string | number;
  createdAt: string;
  codSettledAt?: string | null;
};

export default function LivreurPage() {
  const { session } = useAuth();
  const [parcels, setParcels] = useState<ParcelRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const firstName = session?.user.name?.split(/\s+/)[0] ?? "";

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    apiFetch<ParcelRow[]>("/parcels", { token: session.accessToken })
      .then(setParcels)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const counts = useMemo(() => {
    const total = parcels.length;
    const inProgress = parcels.filter((p) =>
      ["EN_COURS", "AU_DEPOT", "A_ENLEVER", "ENLEVES"].includes(p.status),
    ).length;
    const delivered = parcels.filter(
      (p) => p.status === "LIVRES" || p.status === "LIVRES_PAYES",
    ).length;
    const revenue = parcels.reduce((s, p) => s + Number(p.price || 0), 0);
    const solde = parcels
      .filter(
        (p) =>
          (p.status === "LIVRES" || p.status === "LIVRES_PAYES") &&
          !p.codSettledAt,
      )
      .reduce((s, p) => s + Number(p.price || 0), 0);
    const deliveryRate = total ? Math.round((delivered / total) * 100) : 0;
    return { total, inProgress, delivered, revenue, solde, deliveryRate };
  }, [parcels]);

  const statusKpis = useMemo(
    () =>
      buildOpsStatusKpis({
        basePath: "/livreur",
        countsByStatus: countByStatus(parcels),
        totalLabel: "Mes colis",
        totalCount: parcels.length,
      }),
    [parcels],
  );

  const dayKeys = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    for (const p of parcels) {
      const key = p.createdAt.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([date, total]) => ({
      date,
      label: date.slice(5),
      total,
    }));
  }, [parcels]);

  if (loading) {
    return <OpsDashboardLoader label="Chargement de la tournée…" />;
  }

  if (error) {
    return (
      <p className="rounded-xl border border-[#E11D48]/40 bg-[#E11D48]/10 px-4 py-3 text-sm text-[#fb7185]">
        {error}
      </p>
    );
  }

  return (
    <MobileOpsDashboard
      basePath="/livreur"
      firstName={firstName}
      subtitle="Prêt pour une nouvelle journée ?"
      kpis={statusKpis}
      revenue={counts.revenue}
      solde={counts.solde}
      inProgress={counts.inProgress}
      delivered={counts.delivered}
      deliveryRate={counts.deliveryRate}
      performanceParcels={parcels}
      last7Days={dayKeys}
      recent={parcels.slice(0, 12)}
      returns={parcels.filter((p) => p.status.startsWith("RETOUR")).slice(0, 5)}
      deliveredRecent={parcels
        .filter((p) => p.status === "LIVRES" || p.status === "LIVRES_PAYES")
        .slice(0, 8)}
      isSender={false}
      showNouveauCta
    />
  );
}
