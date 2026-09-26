"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Package,
  Pencil,
  Printer,
} from "lucide-react";
import { useToast } from "@/components/Feedback";
import {
  Button,
  EmptyState,
  SearchInput,
  StatusBadge,
  TableCard,
  tableClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatTnd, type Parcel } from "@/lib/domain";
import { downloadParcelsExcel, openBordereauPdf, openParcelListPdf } from "@/lib/parcel-report";
import { useAuth } from "@/lib/auth-context";
import { canSeeDeliveryMode } from "@/lib/roles";
import { STATUS_META, type StatusKey } from "@/lib/status-meta";

export type DetailParcel = Parcel;

type SortKey = "code" | "recipientName" | "price" | "createdAt" | "status";

const PAGE_SIZE = 10;

function compare(a: Parcel, b: Parcel, key: SortKey) {
  if (key === "price") return Number(a.price) - Number(b.price);
  if (key === "createdAt") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return String(a[key] ?? "").localeCompare(String(b[key] ?? ""), "fr", { numeric: true });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-TN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ParcelDetailTable({
  rows,
  onEdit,
  canEditRow,
  detailBasePath,
  reportTitle = "Liste des colis",
  loading = false,
}: {
  rows: Parcel[];
  onEdit?: (row: Parcel) => void;
  canEditRow?: (row: Parcel) => boolean;
  detailBasePath?: string;
  reportTitle?: string;
  loading?: boolean;
}) {
  const { session } = useAuth();
  const toast = useToast();
  const showModes = canSeeDeliveryMode(session?.user.role);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) =>
          [
            r.code,
            r.recipientName,
            r.phone,
            r.address,
            r.city,
            r.governorate,
            r.notes,
            r.designation,
            STATUS_META[r.status as StatusKey]?.label ?? r.status,
            String(r.price),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : [...rows];
    list.sort((a, b) => (sortDir === "asc" ? 1 : -1) * compare(a, b, sortKey));
    return list;
  }, [rows, query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstIndex = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastIndex = (currentPage - 1) * PAGE_SIZE + pageRows.length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "createdAt" || key === "price" ? "desc" : "asc");
    }
  }

  function reportSlug() {
    return (
      reportTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "colis"
    );
  }

  function exportExcel() {
    downloadParcelsExcel(filtered, `umbrella-${reportSlug()}`, { includeMode: showModes });
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
      toast.error("Export PDF impossible", err instanceof Error ? err.message : undefined);
    }
  }

  function printBordereau(row: Parcel) {
    if (row.bordereauUrl && !row.bordereauUrl.includes("example.com")) {
      window.open(row.bordereauUrl, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      openBordereauPdf(row, { includeMode: showModes });
    } catch (err) {
      toast.error("Bordereau impossible", err instanceof Error ? err.message : undefined);
    }
  }

  function SortHead({ label, column, className }: { label: string; column: SortKey; className?: string }) {
    const active = sortKey === column;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th
        className={cn(thClass, className)}
        aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => toggleSort(column)}
          className={cn("inline-flex items-center gap-1 hover:text-brand", active && "text-ink")}
        >
          {label}
          <Icon className="h-3 w-3 opacity-70" aria-hidden />
        </button>
      </th>
    );
  }

  function codeCell(row: Parcel) {
    return detailBasePath ? (
      <Link
        href={`${detailBasePath}/${row.id}`}
        className="font-mono text-xs font-semibold text-brand hover:underline"
      >
        {row.code ?? `#${row.id}`}
      </Link>
    ) : (
      <span className="font-mono text-xs font-semibold text-ink">{row.code ?? `#${row.id}`}</span>
    );
  }

  function rowActions(row: Parcel) {
    const editable = onEdit && (canEditRow ? canEditRow(row) : true);
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          title="Imprimer le bordereau"
          aria-label={`Imprimer le bordereau ${row.code ?? row.id}`}
          onClick={() => printBordereau(row)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cream text-ink-muted transition hover:border-brand hover:text-brand"
        >
          <Printer className="h-4 w-4" />
        </button>
        {onEdit ? (
          <button
            type="button"
            title={editable ? "Modifier" : "Seuls les colis en attente sont modifiables"}
            aria-label={`Modifier ${row.code ?? row.id}`}
            disabled={!editable}
            onClick={() => onEdit(row)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cream text-ink-muted transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    );
  }

  const toolbar = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={exportExcel}>
          Excel
        </Button>
        <Button variant="secondary" size="sm" icon={FileText} onClick={exportPdf}>
          PDF
        </Button>
      </div>
      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        placeholder="Code, nom, téléphone, ville…"
        className="w-full md:w-72"
      />
    </>
  );

  const footer = (
    <div className="flex flex-col gap-3 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        {filtered.length === 0
          ? "Aucun résultat"
          : `${firstIndex}–${lastIndex} sur ${filtered.length} colis`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Précédent
        </Button>
        <span className="min-w-[4rem] text-center font-semibold text-ink">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Suivant
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <TableCard toolbar={toolbar}>
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-cream-soft/60" />
          ))}
        </div>
      </TableCard>
    );
  }

  return (
    <TableCard toolbar={toolbar} footer={filtered.length > PAGE_SIZE || query ? footer : undefined}>
      {pageRows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Package}
            title={query ? "Aucun colis ne correspond" : "Aucun colis"}
            description={
              query ? "Essayez un autre code, nom ou téléphone." : "Les colis apparaîtront ici."
            }
          />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-cream/70 md:hidden">
            {pageRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {codeCell(row)}
                    <p className="truncate font-semibold text-ink">{row.recipientName}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {row.city}, {row.governorate} · {row.phone}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink">{formatTnd(row.price)}</p>
                  {rowActions(row)}
                </div>
              </li>
            ))}
          </ul>

          <table className={cn(tableClass, "hidden md:table")}>
            <thead className={theadClass}>
              <tr>
                <SortHead label="Code" column="code" />
                <SortHead label="Destinataire" column="recipientName" />
                <SortHead label="Statut" column="status" />
                <SortHead label="COD" column="price" className="text-right" />
                <SortHead label="Ajouté le" column="createdAt" />
                <th className={thClass}>Désignation</th>
                <th className={cn(thClass, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className={trClass}>
                  <td className={tdClass}>
                    {codeCell(row)}
                    {showModes ? (
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                        {row.mode}
                      </p>
                    ) : null}
                  </td>
                  <td className={tdClass}>
                    <p className="font-semibold text-ink">{row.recipientName}</p>
                    <p className="text-xs text-ink-muted">{row.phone}</p>
                    <p className="max-w-xs truncate text-xs text-ink-muted">
                      {row.address}, {row.city} · {row.governorate}
                    </p>
                  </td>
                  <td className={tdClass}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className={cn(tdClass, "whitespace-nowrap text-right font-semibold text-ink")}>
                    {formatTnd(row.price)}
                  </td>
                  <td className={cn(tdClass, "whitespace-nowrap text-ink-muted")}>
                    {formatDate(row.createdAt)}
                  </td>
                  <td className={cn(tdClass, "max-w-[12rem] truncate text-ink")}>
                    {row.designation ?? row.notes ?? "—"}
                  </td>
                  <td className={tdClass}>{rowActions(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </TableCard>
  );
}
