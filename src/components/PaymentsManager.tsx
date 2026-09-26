"use client";

import { useMemo, useState } from "react";
import { Banknote, CheckCircle2, Clock3, HandCoins, Wallet, XCircle } from "lucide-react";
import { errorText, useConfirm, useToast } from "@/components/Feedback";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Panel,
  SegmentedTabs,
  StatCard,
  StatusBadge,
  TableCard,
  tableClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
  type BadgeTone,
} from "@/components/ui";
import {
  formatTnd,
  toAmount,
  type Parcel,
  type Payment,
  type PaymentStatus,
} from "@/lib/domain";
import { useApi, useApiQuery } from "@/lib/use-api";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  EN_DEMANDE: "En demande",
  APPROUVE: "Approuvé",
  PAYE: "Payé",
  REJETE: "Rejeté",
};

const STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  EN_DEMANDE: "warning",
  APPROUVE: "info",
  PAYE: "success",
  REJETE: "danger",
};

const ACTIVE: PaymentStatus[] = ["EN_DEMANDE", "APPROUVE", "PAYE"];
const DELIVERED = ["LIVRES", "LIVRES_PAYES"];

type Filter = "ALL" | PaymentStatus;

export function PaymentsManager({
  canCreate = true,
  canModerate = false,
}: {
  canCreate?: boolean;
  canModerate?: boolean;
}) {
  const request = useApi();
  const toast = useToast();
  const confirm = useConfirm();
  const payments = useApiQuery<Payment[]>("/payments");
  const parcels = useApiQuery<Parcel[]>(canCreate ? "/parcels" : null);
  const [selected, setSelected] = useState<number[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const paymentList = useMemo(() => payments.data ?? [], [payments.data]);

  const eligible = useMemo(() => {
    const requested = new Set(
      paymentList
        .filter((p) => ACTIVE.includes(p.status))
        .flatMap((p) => p.items.map((i) => i.parcel.id)),
    );
    return (parcels.data ?? []).filter(
      (p) => DELIVERED.includes(p.status) && !requested.has(p.id),
    );
  }, [parcels.data, paymentList]);

  const totals = useMemo(() => {
    const sum = (status: PaymentStatus) =>
      paymentList
        .filter((p) => p.status === status)
        .reduce((s, p) => s + toAmount(p.amount), 0);
    return {
      enDemande: sum("EN_DEMANDE"),
      approuve: sum("APPROUVE"),
      paye: sum("PAYE"),
      eligible: eligible.reduce((s, p) => s + toAmount(p.price), 0),
    };
  }, [paymentList, eligible]);

  const selectedTotal = useMemo(
    () =>
      eligible
        .filter((p) => selected.includes(p.id))
        .reduce((s, p) => s + toAmount(p.price), 0),
    [eligible, selected],
  );

  const visible = useMemo(
    () => paymentList.filter((p) => filter === "ALL" || p.status === filter),
    [paymentList, filter],
  );

  const allSelected = eligible.length > 0 && selected.length === eligible.length;

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function reloadAll() {
    await Promise.all([payments.reload(), parcels.reload()]);
  }

  async function onRequest() {
    if (selected.length === 0) {
      toast.error("Sélectionnez au moins un colis livré");
      return;
    }
    setSubmitting(true);
    try {
      const created = await request<Payment>("/payments", "POST", { parcelIds: selected });
      setSelected([]);
      toast.success("Demande envoyée", `#${created.id} · ${formatTnd(created.amount)}`);
      await reloadAll();
    } catch (err) {
      toast.error("Demande impossible", errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(payment: Payment, status: PaymentStatus) {
    if (status === "REJETE") {
      const ok = await confirm({
        title: `Rejeter la demande #${payment.id} ?`,
        description: `${formatTnd(payment.amount)} · ${payment.sender?.name ?? "Expéditeur"}`,
        confirmLabel: "Rejeter",
        tone: "danger",
      });
      if (!ok) return;
    }
    setBusyId(payment.id);
    try {
      await request(`/payments/${payment.id}/status`, "PATCH", { status });
      toast.success(`Paiement #${payment.id} : ${STATUS_LABEL[status].toLowerCase()}`);
      await reloadAll();
    } catch (err) {
      toast.error("Mise à jour impossible", errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  const loadError = payments.error ?? parcels.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements"
        description={
          canModerate
            ? "Validez et versez les montants COD aux expéditeurs"
            : "Demandez le versement de vos colis livrés"
        }
      />

      {loadError ? <ErrorBanner message={loadError} onRetry={() => void reloadAll()} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canCreate ? (
          <StatCard
            label="Disponible"
            value={formatTnd(totals.eligible)}
            hint={`${eligible.length} colis livré(s) à réclamer`}
            icon={HandCoins}
            tone="success"
          />
        ) : null}
        <StatCard label="En demande" value={formatTnd(totals.enDemande)} icon={Clock3} tone="gold" />
        <StatCard label="Approuvé" value={formatTnd(totals.approuve)} icon={Wallet} tone="brand" />
        <StatCard label="Versé" value={formatTnd(totals.paye)} icon={Banknote} />
      </div>

      {canCreate ? (
        <Panel className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">Nouvelle demande</h2>
              <p className="text-sm text-ink-muted">
                Colis livrés non encore inclus dans une demande
              </p>
            </div>
            {eligible.length > 0 ? (
              <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? [] : eligible.map((p) => p.id))}
                />
                Tout sélectionner
              </label>
            ) : null}
          </div>

          {eligible.length === 0 ? (
            <p className="rounded-xl bg-cream-soft/40 px-4 py-6 text-center text-sm text-ink-muted">
              {parcels.loading ? "Chargement…" : "Aucun colis livré à réclamer pour le moment."}
            </p>
          ) : (
            <ul className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {eligible.map((p) => {
                const checked = selected.includes(p.id);
                return (
                  <li key={p.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                        checked ? "border-brand bg-brand/5" : "border-cream hover:border-brand/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand"
                        checked={checked}
                        onChange={() => toggle(p.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs font-semibold text-ink">
                          {p.code ?? `#${p.id}`}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">
                          {p.recipientName} · {p.city}
                        </span>
                      </span>
                      <span className="font-semibold text-ink">{formatTnd(p.price)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-col gap-3 border-t border-cream pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              {selected.length} colis · <span className="font-bold text-ink">{formatTnd(selectedTotal)}</span>
            </p>
            <Button
              icon={HandCoins}
              loading={submitting}
              disabled={selected.length === 0}
              onClick={() => void onRequest()}
            >
              Demander le paiement
            </Button>
          </div>
        </Panel>
      ) : null}

      <TableCard
        toolbar={
          <SegmentedTabs<Filter>
            label="Filtrer les demandes"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ALL", label: "Toutes", count: paymentList.length },
              ...(Object.keys(STATUS_LABEL) as PaymentStatus[]).map((s) => ({
                value: s,
                label: STATUS_LABEL[s],
                count: paymentList.filter((p) => p.status === s).length,
              })),
            ]}
          />
        }
      >
        {payments.loading && paymentList.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-cream-soft/60" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Wallet} title="Aucune demande" description="Les demandes de paiement apparaîtront ici." />
          </div>
        ) : (
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Demande</th>
                {canModerate ? <th className={thClass}>Expéditeur</th> : null}
                <th className={thClass}>Colis</th>
                <th className={`${thClass} text-right`}>Montant</th>
                <th className={thClass}>Statut</th>
                {canModerate ? <th className={`${thClass} text-right`}>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const busy = busyId === p.id;
                return (
                  <tr key={p.id} className={trClass}>
                    <td className={tdClass}>
                      <p className="font-semibold text-ink">#{p.id}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(p.createdAt).toLocaleDateString("fr-TN")}
                        {p.note ? ` · ${p.note}` : ""}
                      </p>
                    </td>
                    {canModerate ? (
                      <td className={`${tdClass} text-ink`}>{p.sender?.name ?? "—"}</td>
                    ) : null}
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {p.items.map((i) => (
                          <span
                            key={`${p.id}-${i.parcel.id}`}
                            className="rounded-md bg-cream-soft/60 px-1.5 py-0.5 font-mono text-[11px] text-ink"
                          >
                            {i.parcel.code ?? `#${i.parcel.id}`}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right font-bold text-ink`}>
                      {formatTnd(p.amount)}
                    </td>
                    <td className={tdClass}>
                      <Badge tone={STATUS_TONE[p.status]} dot>
                        {STATUS_LABEL[p.status]}
                      </Badge>
                    </td>
                    {canModerate ? (
                      <td className={tdClass}>
                        <div className="flex flex-wrap justify-end gap-2">
                          {p.status === "EN_DEMANDE" ? (
                            <Button
                              size="sm"
                              variant="success"
                              icon={CheckCircle2}
                              loading={busy}
                              onClick={() => void setStatus(p, "APPROUVE")}
                            >
                              Approuver
                            </Button>
                          ) : null}
                          {p.status === "APPROUVE" ? (
                            <Button
                              size="sm"
                              variant="gold"
                              icon={Banknote}
                              loading={busy}
                              onClick={() => void setStatus(p, "PAYE")}
                            >
                              Marquer payé
                            </Button>
                          ) : null}
                          {p.status === "EN_DEMANDE" || p.status === "APPROUVE" ? (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={XCircle}
                              disabled={busy}
                              onClick={() => void setStatus(p, "REJETE")}
                            >
                              Rejeter
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {canCreate && eligible.length > 0 ? (
        <p className="text-xs text-ink-muted">
          Statuts éligibles : <StatusBadge status="LIVRES" /> <StatusBadge status="LIVRES_PAYES" />
        </p>
      ) : null}
    </div>
  );
}
