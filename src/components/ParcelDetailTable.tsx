"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { FileSpreadsheet, FileText, Pencil, Printer, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";
import {
  downloadParcelsExcel,
  openBordereauPdf,
  openParcelListPdf,
} from "@/lib/parcel-report";
import { useAuth } from "@/lib/auth-context";
import { canSeeDeliveryMode } from "@/lib/roles";

gsap.registerPlugin(useGSAP);

export type DetailParcel = {
  id: number;
  code: string | null;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  price: string | number;
  notes: string | null;
  status: string;
  mode: "EXTERNAL" | "INTERNAL";
  bordereauUrl: string | null;
  createdAt: string;
};

type SortKey = "code" | "recipientName" | "price" | "createdAt" | "notes";

export function ParcelDetailTable({
  rows,
  onEdit,
  detailBasePath,
  reportTitle = "Liste des colis",
}: {
  rows: DetailParcel[];
  onEdit?: (row: DetailParcel) => void;
  detailBasePath?: string;
  reportTitle?: string;
}) {
  const { session } = useAuth();
  const showModes = canSeeDeliveryMode(session?.user.role);
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const pageSize = 8;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (!q) return true;
      const blob = [
        r.code,
        r.recipientName,
        r.phone,
        r.address,
        r.city,
        r.governorate,
        r.notes,
        r.status,
        String(r.price),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });

    list.sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "fr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useGSAP(
    () => {
      gsap.from(".detail-row", {
        autoAlpha: 0,
        y: 14,
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
      });
    },
    { scope: root, dependencies: [pageRows] },
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportExcel() {
    const slug = reportTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    downloadParcelsExcel(filtered, `umbrella-${slug || "colis"}`, {
      includeMode: showModes,
    });
  }

  function exportPdf() {
    try {
      openParcelListPdf({
        title: reportTitle,
        rows: filtered,
        accountName: session?.user.name,
        includeMode: showModes,
      });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Export PDF impossible");
    }
  }

  function printBordereau(row: DetailParcel) {
    if (row.bordereauUrl) {
      window.open(row.bordereauUrl, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      openBordereauPdf(row, { includeMode: showModes });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Bordereau impossible");
    }
  }

  function SortHead({
    label,
    column,
  }: {
    label: string;
    column: SortKey;
  }) {
    return (
      <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className="inline-flex items-center gap-1 hover:text-brand"
        >
          {label}
          <span className="text-[9px] opacity-60">
            {sortKey === column ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div ref={root} className="overflow-hidden rounded-2xl border border-cream bg-surface shadow-soft">
      <div className="flex flex-col gap-3 border-b border-cream-soft bg-cream-soft/40 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Détail</h2>
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cream bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cream bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>

        <label className="relative inline-flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="w-full rounded-xl border border-cream bg-surface py-2 pl-9 pr-3 text-sm outline-none ring-brand focus:ring-2 md:w-64"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-soft/70">
            <tr>
              <SortHead label="Code" column="code" />
              <SortHead label="Nom" column="recipientName" />
              <SortHead label="Prix" column="price" />
              <SortHead label="Date d'ajout" column="createdAt" />
              <SortHead label="Désignation" column="notes" />
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Bordereau
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                BL
              </th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                Modifier
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, idx) => {
              const statusLabel =
                STATUS_META[row.status as StatusKey]?.label ?? row.status;
              const isExchange = row.status === "ECHANGES";
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "detail-row border-t border-cream-soft transition hover:bg-brand/[0.03]",
                    idx % 2 === 1 ? "bg-cream-soft/25" : "bg-surface",
                  )}
                >
                  <td className="px-3 py-3 align-top">
                    {detailBasePath ? (
                      <Link
                        href={`${detailBasePath}/${row.id}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        {row.code}
                      </Link>
                    ) : (
                      <p className="font-semibold text-ink">{row.code}</p>
                    )}
                    {isExchange ? (
                      <p className="text-xs font-semibold text-brand-soft">Echange</p>
                    ) : (
                      <p className="text-[11px] text-ink-muted">{statusLabel}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <p className="font-semibold text-ink">{row.recipientName}</p>
                    <p className="text-xs text-ink-muted">{row.phone}</p>
                    <p className="mt-0.5 max-w-xs text-xs leading-snug text-ink-muted">
                      {row.address} {row.city} {row.governorate}
                    </p>
                  </td>
                  <td className="px-3 py-3 align-top font-semibold text-ink">{row.price}</td>
                  <td className="px-3 py-3 align-top text-ink-muted">
                    {new Date(row.createdAt).toLocaleString("fr-TN")}
                  </td>
                  <td className="px-3 py-3 align-top text-ink">{row.notes ?? "—"}</td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      title="Bordereau"
                      onClick={() => printBordereau(row)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white shadow-sm transition hover:bg-brand-soft"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      title="Bon de livraison"
                      onClick={() => printBordereau(row)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-white shadow-sm transition hover:opacity-90"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      title="Modifier"
                      onClick={() => onEdit?.(row)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#2f7d5b] text-white shadow-sm transition hover:brightness-110"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  Aucun colis
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-cream-soft px-4 py-3 text-xs text-ink-muted md:flex-row md:items-center md:justify-between">
        <p>
          Showing {(currentPage - 1) * pageSize + (pageRows.length ? 1 : 0)} to{" "}
          {(currentPage - 1) * pageSize + pageRows.length} of {filtered.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-cream px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white">
            {currentPage}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-cream px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
