"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, HandCoins, Truck } from "lucide-react";
import { errorText, useConfirm, useToast } from "@/components/Feedback";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  PageHeader,
  Panel,
  SegmentedTabs,
  StatCard,
  tableClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
} from "@/components/ui";
import { formatTnd, type CodItem, type CodPayload } from "@/lib/domain";
import { SortableTh, useTableSort } from "@/lib/table-sort";
import { useApi, useApiQuery } from "@/lib/use-api";

type Filter = "OPEN" | "SETTLED";

type DriverGroup = { key: string; name: string; items: CodItem[]; total: number };

type CodSortKey = "code" | "recipientName" | "price" | "settled";

const COD_SORT = {
  code: (i: CodItem) => i.code ?? "",
  recipientName: (i: CodItem) => i.recipientName,
  price: (i: CodItem) => i.price,
  settled: (i: CodItem) => i.codSettledAt ?? "",
} as const;

function CodItemsTable({
  items,
  filter,
  busyKey,
  onSettle,
}: {
  items: CodItem[];
  filter: Filter;
  busyKey: string | null;
  onSettle: (ids: number[], label: string, key: string, amount: number) => void;
}) {
  const { sorted, sortKey, sortDir, toggleSort } = useTableSort<CodItem, CodSortKey>(
    items,
    COD_SORT,
    "code",
  );

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>
            <SortableTh
              label="Colis"
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
              label="Montant"
              column="price"
              activeKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
              className="text-right"
              buttonClassName="ml-auto"
            />
            <SortableTh
              label="Statut"
              column="settled"
              activeKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            />
            {filter === "OPEN" ? (
              <th className={`${thClass} text-right`}>Action</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id} className={trClass}>
              <td className={`${tdClass} font-mono text-xs font-semibold text-ops-ink`}>
                {item.code}
              </td>
              <td className={tdClass}>
                <p className="text-ops-ink">{item.recipientName}</p>
                <p className="text-xs text-ops-ink/50">{item.city}</p>
              </td>
              <td className={`${tdClass} text-right font-semibold text-ops-ink`}>
                {formatTnd(item.price)}
              </td>
              <td className={tdClass}>
                {item.codSettledAt ? (
                  <Badge tone="success" dot>
                    Encaissé le{" "}
                    {new Date(item.codSettledAt).toLocaleDateString("fr-TN")}
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    En attente
                  </Badge>
                )}
              </td>
              {filter === "OPEN" ? (
                <td className={`${tdClass} text-right`}>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busyKey !== null}
                    onClick={() =>
                      onSettle(
                        [item.id],
                        item.code ?? `#${item.id}`,
                        `item-${item.id}`,
                        item.price,
                      )
                    }
                  >
                    Encaisser
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function groupByDriver(items: CodItem[]): DriverGroup[] {
  const map = new Map<string, DriverGroup>();
  for (const item of items) {
    const key = item.driver ? String(item.driver.id) : "network";
    const group = map.get(key) ?? {
      key,
      name: item.driver?.name ?? "Réseau partenaire",
      items: [],
      total: 0,
    };
    group.items.push(item);
    group.total += item.price;
    map.set(key, group);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export default function CaissierPage() {
  const request = useApi();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useApiQuery<CodPayload>("/cod");
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const items = useMemo(() => data?.items ?? [], [data]);
  const groups = useMemo(
    () => groupByDriver(items.filter((i) => (filter === "OPEN" ? !i.codSettledAt : i.codSettledAt))),
    [items, filter],
  );

  async function settle(ids: number[], label: string, key: string, amount: number) {
    const ok = await confirm({
      title: `Encaisser ${formatTnd(amount)} ?`,
      description: `${ids.length} colis · ${label}`,
      confirmLabel: "Encaisser",
    });
    if (!ok) return;
    setBusyKey(key);
    try {
      const res = await request<{ settled: number }>("/cod/settle", "POST", { parcelIds: ids });
      toast.success("Encaissement enregistré", `${res.settled} colis · ${label}`);
      await reload();
    } catch (err) {
      toast.error("Encaissement impossible", errorText(err));
    } finally {
      setBusyKey(null);
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caisse COD"
        description="Rapprochez les montants encaissés par les livreurs à la livraison"
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="À encaisser"
          value={formatTnd(summary?.openAmount ?? 0)}
          hint={`${summary?.openCount ?? 0} colis livré(s)`}
          icon={HandCoins}
          tone="brand"
        />
        <StatCard
          label="Encaissé"
          value={formatTnd(summary?.settledAmount ?? 0)}
          hint={`${summary?.settledCount ?? 0} colis`}
          icon={Banknote}
          tone="success"
        />
        <StatCard label="Livreurs concernés" value={groups.length} icon={Truck} />
      </div>

      <SegmentedTabs<Filter>
        label="Filtrer la caisse"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "OPEN", label: "À encaisser", count: summary?.openCount ?? 0 },
          { value: "SETTLED", label: "Encaissés", count: summary?.settledCount ?? 0 },
        ]}
      />

      {loading && !data ? <LoadingBlock rows={2} /> : null}

      {!loading && groups.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filter === "OPEN" ? "Caisse à jour" : "Aucun encaissement"}
          description={
            filter === "OPEN"
              ? "Tous les montants COD livrés ont été encaissés."
              : "Les encaissements apparaîtront ici."
          }
        />
      ) : null}

      <div className="space-y-4">
        {groups.map((group) => (
          <Panel key={group.key} className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ops-card bg-ops-ink/[0.04] px-5 py-4">
              <div>
                <p className="font-display text-lg font-bold text-ops-ink">{group.name}</p>
                <p className="text-sm text-ops-ink/50">
                  {group.items.length} colis · <span className="font-semibold text-ops-ink">{formatTnd(group.total)}</span>
                </p>
              </div>
              {filter === "OPEN" ? (
                <Button
                  icon={HandCoins}
                  loading={busyKey === group.key}
                  onClick={() =>
                    void settle(
                      group.items.map((i) => i.id),
                      group.name,
                      group.key,
                      group.total,
                    )
                  }
                >
                  Tout encaisser
                </Button>
              ) : null}
            </div>
            <CodItemsTable
              items={group.items}
              filter={filter}
              busyKey={busyKey}
              onSettle={(ids, label, key, amount) =>
                void settle(ids, label, key, amount)
              }
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
