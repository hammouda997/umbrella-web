"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, LifeBuoy, Plus, XCircle } from "lucide-react";
import { errorText, useToast } from "@/components/Feedback";
import { Modal } from "@/components/Modal";
import {
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  PageHeader,
  SearchInput,
  SegmentedTabs,
  SelectField,
  TableCard,
  TextAreaField,
  TextField,
  tableClass,
  tdClass,
  theadClass,
  thClass,
  trClass,
  type BadgeTone,
} from "@/components/ui";
import type { Parcel, Ticket, TicketStatus } from "@/lib/domain";
import { useApi, useApiQuery } from "@/lib/use-api";

const STATUS_LABEL: Record<TicketStatus, string> = {
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  FERME: "Fermé",
};

const STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  EN_COURS: "warning",
  RESOLU: "success",
  FERME: "neutral",
};

type Filter = "ALL" | TicketStatus;

export function TicketsManager({
  canCreate = true,
  canResolve = false,
}: {
  canCreate?: boolean;
  canResolve?: boolean;
}) {
  const request = useApi();
  const toast = useToast();
  const { data, error, loading, reload } = useApiQuery<Ticket[]>("/tickets");
  const { data: parcelData } = useApiQuery<Parcel[]>(canCreate ? "/parcels" : null);
  const tickets = useMemo(() => data ?? [], [data]);
  const parcels = useMemo(() => parcelData ?? [], [parcelData]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const counts = useMemo(
    () => ({
      ALL: tickets.length,
      EN_COURS: tickets.filter((t) => t.status === "EN_COURS").length,
      RESOLU: tickets.filter((t) => t.status === "RESOLU").length,
      FERME: tickets.filter((t) => t.status === "FERME").length,
    }),
    [tickets],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (filter === "ALL" || t.status === filter) &&
        (!q ||
          [t.title, t.description, t.parcel?.code, t.createdBy?.name]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [tickets, filter, query]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parcelId = Number(form.get("parcelId"));
    setSaving(true);
    try {
      const ticket = await request<Ticket>("/tickets", "POST", {
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || undefined,
        parcelId: parcelId || undefined,
      });
      setCreating(false);
      toast.success("Ticket ouvert", `#${ticket.id} · ${ticket.title}`);
      await reload();
    } catch (err) {
      toast.error("Ticket non créé", errorText(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(ticket: Ticket, status: TicketStatus) {
    setBusyId(ticket.id);
    try {
      await request(`/tickets/${ticket.id}/status`, "PATCH", { status });
      toast.success(`Ticket #${ticket.id} ${STATUS_LABEL[status].toLowerCase()}`);
      setSelected(null);
      await reload();
    } catch (err) {
      toast.error("Mise à jour impossible", errorText(err));
    } finally {
      setBusyId(null);
    }
  }

  function actions(ticket: Ticket) {
    const busy = busyId === ticket.id;
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {canResolve && ticket.status === "EN_COURS" ? (
          <Button
            size="sm"
            variant="success"
            icon={CheckCircle2}
            loading={busy}
            onClick={() => void setStatus(ticket, "RESOLU")}
          >
            Résoudre
          </Button>
        ) : null}
        {ticket.status !== "FERME" ? (
          <Button
            size="sm"
            variant="secondary"
            icon={XCircle}
            disabled={busy}
            onClick={() => void setStatus(ticket, "FERME")}
          >
            Fermer
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Support"
        description={`${counts.EN_COURS} ticket(s) en cours · ${tickets.length} au total`}
        actions={
          canCreate ? (
            <Button icon={Plus} onClick={() => setCreating(true)}>
              Nouveau ticket
            </Button>
          ) : undefined
        }
      />

      {error ? <ErrorBanner message={error} onRetry={() => void reload()} /> : null}

      <TableCard
        toolbar={
          <>
            <SegmentedTabs<Filter>
              label="Filtrer par statut"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: "Tous", count: counts.ALL },
                { value: "EN_COURS", label: "En cours", count: counts.EN_COURS },
                { value: "RESOLU", label: "Résolus", count: counts.RESOLU },
                { value: "FERME", label: "Fermés", count: counts.FERME },
              ]}
            />
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Sujet, colis, auteur…"
              className="w-full md:w-64"
            />
          </>
        }
      >
        {loading && tickets.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-ops-ink/[0.06]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={LifeBuoy}
              title="Aucun ticket"
              description={
                query || filter !== "ALL"
                  ? "Aucun ticket ne correspond à ce filtre."
                  : "Ouvrez un ticket si un colis pose problème."
              }
            />
          </div>
        ) : (
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>Ticket</th>
                <th className={thClass}>Colis</th>
                <th className={thClass}>Statut</th>
                <th className={`${thClass} hidden md:table-cell`}>Ouvert le</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className={trClass}>
                  <td className={tdClass}>
                    <button
                      type="button"
                      onClick={() => setSelected(t)}
                      className="text-left"
                    >
                      <p className="font-semibold text-ops-ink hover:text-ops-accent">
                        #{t.id} · {t.title}
                      </p>
                      {t.description ? (
                        <p className="max-w-md truncate text-xs text-ops-ink/50">{t.description}</p>
                      ) : null}
                      {t.createdBy ? (
                        <p className="text-[11px] text-ops-ink/50">par {t.createdBy.name}</p>
                      ) : null}
                    </button>
                  </td>
                  <td className={`${tdClass} font-mono text-xs text-ops-ink/50`}>
                    {t.parcel?.code ?? "—"}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={STATUS_TONE[t.status]} dot>
                      {STATUS_LABEL[t.status]}
                    </Badge>
                  </td>
                  <td className={`${tdClass} hidden whitespace-nowrap text-ops-ink/50 md:table-cell`}>
                    {new Date(t.createdAt).toLocaleDateString("fr-TN")}
                  </td>
                  <td className={tdClass}>{actions(t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nouveau ticket"
        description="Décrivez le problème, l'équipe support vous répond rapidement."
        size="md"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Annuler
            </Button>
            <Button type="submit" form="ticket-create-form" loading={saving}>
              Ouvrir le ticket
            </Button>
          </div>
        }
      >
        <form id="ticket-create-form" onSubmit={onCreate} className="space-y-4">
          <TextField name="title" label="Sujet" required minLength={3} maxLength={120} />
          <SelectField name="parcelId" label="Colis concerné" defaultValue="">
            <option value="">Aucun colis précis</option>
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ?? `#${p.id}`} · {p.recipientName}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            name="description"
            label="Description"
            rows={4}
            maxLength={1000}
            placeholder="Que s'est-il passé ?"
          />
        </form>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Ticket #${selected.id}` : ""}
        description={selected?.title}
        size="md"
        footer={selected ? actions(selected) : undefined}
      >
        {selected ? (
          <dl className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[selected.status]} dot>
                {STATUS_LABEL[selected.status]}
              </Badge>
              {selected.parcel?.code ? <Badge tone="info">{selected.parcel.code}</Badge> : null}
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ops-ink/50">
                Description
              </dt>
              <dd className="mt-1 whitespace-pre-line text-ops-ink">
                {selected.description ?? "Aucune description"}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ops-ink/50">
                  Auteur
                </dt>
                <dd className="mt-1 text-ops-ink">{selected.createdBy?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ops-ink/50">
                  Ouvert le
                </dt>
                <dd className="mt-1 text-ops-ink">
                  {new Date(selected.createdAt).toLocaleString("fr-TN")}
                </dd>
              </div>
            </div>
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
