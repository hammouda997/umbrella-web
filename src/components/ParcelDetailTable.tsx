"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
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
import { compareSortValues, SortableTh, type SortDir } from "@/lib/table-sort";

export type DetailParcel = Parcel;

type SortKey = "code" | "recipientName" | "price" | "createdAt" | "status";

const PAGE_SIZE = 10;

const PARCEL_SORT = {
  code: (p: Parcel) => p.code ?? "",
  recipientName: (p: Parcel) => p.recipientName,
  price: (p: Parcel) => Number(p.price),
  createdAt: (p: Parcel) => p.createdAt,
  status: (p: Parcel) => STATUS_META[p.status as StatusKey]?.label ?? p.status,
} as const;

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
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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
            r.zone?.name,
            STATUS_META[r.status as StatusKey]?.label ?? r.status,
            String(r.price),
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        )
      : [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    const read = PARCEL_SORT[sortKey];
    list.sort((a, b) => {
      const za = a.zone?.name?.trim() || "\uffff";
      const zb = b.zone?.name?.trim() || "\uffff";
      const byZone = za.localeCompare(zb, "fr", { sensitivity: "base" });
      if (byZone !== 0) return byZone;
      return dir * compareSortValues(read(a), read(b));
    });
    return list;
  }, [rows, query, sortKey, sortDir]);

  function zoneKey(row: Parcel) {
    return row.zone?.id ?? row.zoneId ?? "none";
  }

  function zoneLabel(row: Parcel) {
    return row.zone?.name?.trim() || "Sans zone";
  }

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

  function codeCell(row: Parcel) {
    return detailBasePath ? (
      <Link
        href={`${detailBasePath}/${row.id}`}
        className="font-mono text-xs font-semibold text-ops-accent hover:underline"
      >
        {row.code ?? `#${row.id}`}
      </Link>
    ) : (
      <span className="font-mono text-xs font-semibold text-ops-ink">
        {row.code ?? `#${row.id}`}
      </span>
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ops-card text-ops-ink/45 transition hover:border-ops-accent/50 hover:text-ops-accent"
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ops-card text-ops-ink/45 transition hover:border-ops-accent/50 hover:text-ops-accent disabled:cursor-not-allowed disabled:opacity-40"
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
        placeholder="Code, nom, zone, téléphone…"
        className="w-full md:w-72"
      />
    </>
  );

  function zoneHeader(row: Parcel, index: number, list: Parcel[]) {
    const prev = index > 0 ? list[index - 1] : null;
    if (prev && zoneKey(prev) === zoneKey(row)) return null;
    const count = filtered.filter((r) => zoneKey(r) === zoneKey(row)).length;
    return (
      <div className="flex items-center justify-between gap-2 border-b border-ops-card bg-ops-page/70 px-4 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-ops-ink">
          {zoneLabel(row)}
        </p>
        <span className="text-[11px] font-semibold text-ops-ink/45">
          {count} colis
        </span>
      </div>
    );
  }

  const footer = (
    <div className="flex flex-col gap-3 text-xs text-ops-ink/45 sm:flex-row sm:items-center sm:justify-between">
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
        <span className="min-w-[4rem] text-center font-semibold text-ops-ink">
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
            <div key={i} className="h-12 animate-pulse rounded-xl bg-ops-ink/[0.06]" />
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
          <ul className="md:hidden">
            {pageRows.map((row, index) => (
              <li key={row.id}>
                {zoneHeader(row, index, pageRows)}
                <div className="space-y-2 border-b border-ops-card px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {codeCell(row)}
                      <p className="truncate font-semibold text-ops-ink">
                        {row.recipientName}
                      </p>
                      <p className="truncate text-xs text-ops-ink/45">
                        {row.city}, {row.governorate} · {row.phone}
                      </p>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ops-ink">
                      {formatTnd(row.price)}
                    </p>
                    {rowActions(row)}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <table className={cn(tableClass, "hidden md:table")}>
            <thead className={theadClass}>
              <tr>
                <SortableTh
                  label="Code"
                  column="code"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Destinataire"
                  column="recipientName"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Statut"
                  column="status"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="Montant"
                  column="price"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                  className="text-right"
                  buttonClassName="ml-auto"
                />
                <SortableTh
                  label="Ajouté le"
                  column="createdAt"
                  activeKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <th className={thClass}>Désignation</th>
                <th className={cn(thClass, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => {
                const showZone =
                  index === 0 || zoneKey(pageRows[index - 1]!) !== zoneKey(row);
                const zoneCount = filtered.filter((r) => zoneKey(r) === zoneKey(row)).length;
                return (
                  <Fragment key={row.id}>
                    {showZone ? (
                      <tr className="bg-ops-page/70">
                        <td
                          colSpan={7}
                          className="border-b border-ops-card px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-ops-ink"
                        >
                          {zoneLabel(row)}
                          <span className="ml-2 font-semibold normal-case tracking-normal text-ops-ink/45">
                            · {zoneCount} colis
                          </span>
                        </td>
                      </tr>
                    ) : null}
                    <tr className={trClass}>
                      <td className={tdClass}>
                        {codeCell(row)}
                        {showModes ? (
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ops-ink/40">
                            {row.mode}
                          </p>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        <p className="font-semibold text-ops-ink">{row.recipientName}</p>
                        <p className="text-xs text-ops-ink/45">{row.phone}</p>
                        <p className="max-w-xs truncate text-xs text-ops-ink/45">
                          {row.address}, {row.city} · {row.governorate}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <StatusBadge status={row.status} />
                      </td>
                      <td
                        className={cn(
                          tdClass,
                          "whitespace-nowrap text-right font-semibold text-ops-ink",
                        )}
                      >
                        {formatTnd(row.price)}
                      </td>
                      <td className={cn(tdClass, "whitespace-nowrap text-ops-ink/45")}>
                        {formatDate(row.createdAt)}
                      </td>
                      <td className={cn(tdClass, "max-w-[12rem] truncate text-ops-ink")}>
                        {row.designation ?? row.notes ?? "—"}
                      </td>
                      <td className={tdClass}>{rowActions(row)}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </TableCard>
  );
}
