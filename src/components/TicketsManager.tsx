"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Ticket = {
  id: number;
  title: string;
  description: string | null;
  status: "EN_COURS" | "RESOLU" | "FERME";
  createdAt: string;
  parcel?: { id: number; code: string | null } | null;
  createdBy?: { id: number; name: string; email: string };
};

export function TicketsManager({
  canCreate = true,
  canResolve = false,
}: {
  canCreate?: boolean;
  canResolve?: boolean;
}) {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    if (!session?.accessToken) return;
    const data = await apiFetch<Ticket[]>("/tickets", {
      token: session.accessToken,
    });
    setTickets(data);
  }

  useEffect(() => {
    load().catch((e: Error) => setMessage(e.message));
  }, [session]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken) return;
    const form = new FormData(e.currentTarget);
    await apiFetch("/tickets", {
      method: "POST",
      token: session.accessToken,
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || undefined,
        parcelId: form.get("parcelId")
          ? Number(form.get("parcelId"))
          : undefined,
      }),
    });
    e.currentTarget.reset();
    setMessage("Ticket créé");
    await load();
  }

  async function setStatus(id: number, status: Ticket["status"]) {
    if (!session?.accessToken) return;
    await apiFetch(`/tickets/${id}/status`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ status }),
    });
    setMessage(`Ticket #${id} → ${status}`);
    await load();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-ink">Tickets</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Support colis · {tickets.length} ticket(s)
        </p>
      </header>

      {canCreate ? (
        <form
          onSubmit={onCreate}
          className="grid gap-3 rounded-xl border border-cream bg-surface p-5 shadow-soft md:grid-cols-4"
        >
          <input
            name="title"
            required
            placeholder="Sujet"
            className="rounded-lg border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-brand md:col-span-2"
          />
          <input
            name="parcelId"
            type="number"
            placeholder="ID colis (opt.)"
            className="rounded-lg border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            Ouvrir
          </button>
          <textarea
            name="description"
            rows={2}
            placeholder="Description"
            className="rounded-lg border border-cream-soft px-3 py-2.5 text-sm outline-none focus:border-brand md:col-span-4"
          />
        </form>
      ) : null}

      {message ? <p className="text-sm font-medium text-gold">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-cream bg-surface shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-soft/70 text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Sujet</th>
              <th className="px-4 py-3">Colis</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-cream-soft">
                <td className="px-4 py-3 font-semibold">{t.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{t.title}</p>
                  <p className="text-xs text-ink-muted">{t.description}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {t.parcel?.code ?? "—"}
                </td>
                <td className="px-4 py-3">{t.status}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {canResolve && t.status === "EN_COURS" ? (
                      <button
                        type="button"
                        onClick={() => setStatus(t.id, "RESOLU")}
                        className="rounded-md bg-[#2f7d5b] px-2 py-1 text-xs font-semibold text-white"
                      >
                        Résoudre
                      </button>
                    ) : null}
                    {t.status !== "FERME" ? (
                      <button
                        type="button"
                        onClick={() => setStatus(t.id, "FERME")}
                        className="rounded-md border border-cream px-2 py-1 text-xs font-semibold"
                      >
                        Fermer
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  Aucun ticket
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
