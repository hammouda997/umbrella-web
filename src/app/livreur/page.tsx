"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileOpsDashboard, type OpsKpi } from "@/components/MobileOpsDashboard";
import { OpsDashboardLoader } from "@/components/OpsDashboardLoader";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ParcelRow = {
  id: number;
  code: string | null;
  recipientName: string;
  city: string;
  status: string;
  price: string | number;
  createdAt: string;
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
    const awaiting = parcels.filter((p) => p.status === "EN_ATTENTE").length;
    const inProgress = parcels.filter((p) =>
      ["EN_COURS", "AU_DEPOT", "A_ENLEVER", "ENLEVES"].includes(p.status),
    ).length;
    const delivered = parcels.filter(
      (p) => p.status === "LIVRES" || p.status === "LIVRES_PAYES",
    ).length;
    const returns = parcels.filter((p) => p.status.startsWith("RETOUR")).length;
    const verify = parcels.filter((p) => p.status === "A_VERIFIER").length;
    const depot = parcels.filter((p) => p.status === "RETOUR_DEPOT").length;
    const revenue = parcels.reduce((s, p) => s + Number(p.price || 0), 0);
    const deliveryRate = total ? Math.round((delivered / total) * 100) : 0;
    return {
      total,
      awaiting,
      inProgress,
      delivered,
      returns,
      verify,
      depot,
      revenue,
      deliveryRate,
      late: Math.min(2, inProgress),
    };
  }, [parcels]);

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

  const primaryKpis: OpsKpi[] = [
    {
      label: "Mes colis",
      value: String(counts.total),
      href: "/livreur/parcels",
      icon: "package",
      accent: "bg-[#3a1a1f] text-[#fb7185]",
      glow: "shadow-[0_0_32px_rgba(225,29,72,0.14)]",
      delta: "+25%",
      deltaTone: "up",
    },
    {
      label: "En attente",
      value: String(counts.awaiting),
      href: "/livreur/parcels",
      icon: "clock",
      accent: "bg-[#14291f] text-[#34d399]",
      glow: "shadow-[0_0_32px_rgba(16,185,129,0.14)]",
      delta: counts.awaiting ? "-50%" : "=",
      deltaTone: counts.awaiting ? "down" : "flat",
    },
    {
      label: "En cours",
      value: String(counts.inProgress),
      href: "/livreur",
      icon: "truck",
      accent: "bg-[#152536] text-[#38bdf8]",
      glow: "shadow-[0_0_32px_rgba(14,165,233,0.14)]",
      delta: "+100%",
      deltaTone: "up",
    },
    {
      label: "Livrés",
      value: String(counts.delivered),
      href: "/livreur/parcels",
      icon: "check",
      accent: "bg-[#261a3a] text-[#c4b5fd]",
      glow: "shadow-[0_0_32px_rgba(139,92,246,0.14)]",
      delta: "+33%",
      deltaTone: "up",
    },
    {
      label: "Retours",
      value: String(counts.returns),
      href: "/livreur/parcels",
      icon: "return",
      accent: "bg-[#2f2414] text-[#fbbf24]",
      glow: "shadow-[0_0_32px_rgba(251,191,36,0.12)]",
      delta: "=",
      deltaTone: "flat",
    },
  ];

  const extraKpis: OpsKpi[] = [
    {
      label: "À vérifier",
      value: String(counts.verify),
      href: "/livreur/parcels",
      icon: "check",
      accent: "bg-teal-500/20 text-teal-300",
      glow: "",
    },
    {
      label: "Retour dépôt",
      value: String(counts.depot),
      href: "/livreur/parcels",
      icon: "return",
      accent: "bg-pink-500/20 text-pink-300",
      glow: "",
    },
    {
      label: "Colis en retard",
      value: String(counts.late),
      href: "/livreur/parcels",
      icon: "clock",
      accent: "bg-indigo-500/20 text-indigo-300",
      glow: "",
      delta: counts.late ? "+100%" : undefined,
      deltaTone: counts.late ? "up" : "flat",
    },
  ];

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
      kpis={primaryKpis}
      extraKpis={extraKpis}
      revenue={counts.revenue}
      inProgress={counts.inProgress}
      delivered={counts.delivered}
      deliveryRate={counts.deliveryRate}
      lateCount={counts.late}
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
