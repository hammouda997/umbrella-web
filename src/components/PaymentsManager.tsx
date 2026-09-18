"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Parcel = {
  id: number;
  code: string | null;
  price: string | number;
  status: string;
};

type Payment = {
  id: number;
  amount: string | number;
  status: "EN_DEMANDE" | "APPROUVE" | "PAYE" | "REJETE";
  note: string | null;
  createdAt: string;
  sender?: { name: string; email: string };
  items: Array<{ parcel: { id: number; code: string | null }; amount: string | number }>;
};

export function PaymentsManager({
  canCreate = true,
  canModerate = false,
}: {
  canCreate?: boolean;
  canModerate?: boolean;
}) {
  const { session } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const eligible = useMemo(
    () => parcels.filter((p) => p.status === "LIVRES" || p.status === "LIVRES_PAYES"),
    [parcels],
  );

  async function load() {
    if (!session?.accessToken) return;
    const [pay, cols] = await Promise.all([
      apiFetch<Payment[]>("/payments", { token: session.accessToken }),
      apiFetch<Parcel[]>("/parcels", { token: session.accessToken }),
    ]);
    setPayments(pay);
    setParcels(cols);
  }

  useEffect(() => {
    load().catch((e: Error) => setMessage(e.message));
  }, [session]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!session?.accessToken || selected.length === 0) {
      setMessage("Sélectionnez au moins un colis livré");
      return;
    }
    await apiFetch("/payments", {
      method: "POST",
      token: session.accessToken,
      body: JSON.stringify({ parcelIds: selected }),
    });
    setSelected([]);
    setMessage("Demande de paiement créée");
    await load();
  }

  async function setStatus(id: number, status: Payment["status"]) {
    if (!session?.accessToken) return;
    await apiFetch(`/payments/${id}/status`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ status }),
    });
    setMessage(`Paiement #${id} → ${status}`);
    await load();
  }

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Demandes de paiement
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Colis livrés → remboursement / règlement
        </p>
      </header>

      {canCreate ? (
        <form
          onSubmit={onCreate}
          className="space-y-3 rounded-xl border border-cream bg-surface p-5 shadow-soft"
        >
          <p className="text-sm font-medium text-ink">
            Colis éligibles ({eligible.length})
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {eligible.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-cream-soft px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <span className="font-semibold">{p.code ?? `#${p.id}`}</span>
                <span className="text-ink-muted">{p.price} DT</span>
              </label>
            ))}
            {eligible.length === 0 ? (
              <p className="text-sm text-ink-muted">Aucun colis livré</p>
            ) : null}
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
          >
            Demander le paiement
          </button>
        </form>
      ) : null}

      {message ? <p className="text-sm font-medium text-gold">{message}</p> : null}

      <div className="overflow-hidden rounded-xl border border-cream bg-surface shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-soft/70 text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Colis</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-cream-soft">
                <td className="px-4 py-3 font-semibold">{p.id}</td>
                <td className="px-4 py-3">{p.amount} DT</td>
                <td className="px-4 py-3 text-ink-muted">
                  {p.items.map((i) => i.parcel.code ?? i.parcel.id).join(", ")}
                </td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">
                  {canModerate && p.status === "EN_DEMANDE" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, "APPROUVE")}
                        className="rounded-md bg-[#2f7d5b] px-2 py-1 text-xs font-semibold text-white"
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(p.id, "REJETE")}
                        className="rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white"
                      >
                        Rejeter
                      </button>
                    </div>
                  ) : null}
                  {canModerate && p.status === "APPROUVE" ? (
                    <button
                      type="button"
                      onClick={() => setStatus(p.id, "PAYE")}
                      className="rounded-md bg-gold px-2 py-1 text-xs font-semibold text-white"
                    >
                      Marquer payé
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  Aucune demande
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
