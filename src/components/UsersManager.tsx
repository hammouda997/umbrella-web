"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AppRole } from "@/lib/roles";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader } from "@/components/ui";

type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: AppRole;
  isActive: boolean;
  createdAt: string;
};

const CREATABLE_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "EXPEDITEUR",
  "LIVREUR",
  "CLIENT",
];

export function UsersManager({ allowSuperAdmin = false }: { allowSuperAdmin?: boolean }) {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const roles = allowSuperAdmin
    ? CREATABLE_ROLES
    : CREATABLE_ROLES.filter((r) => r !== "SUPER_ADMIN");

  async function load() {
    if (!session?.accessToken) return;
    setUsers(await apiFetch<UserRow[]>("/users", { token: session.accessToken }));
  }

  useEffect(() => {
    load().catch((e: Error) => setMessage(e.message));
  }, [session]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.accessToken) return;
    const form = new FormData(e.currentTarget);
    await apiFetch("/users", {
      method: "POST",
      token: session.accessToken,
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        phone: form.get("phone") || undefined,
        role: form.get("role"),
      }),
    });
    e.currentTarget.reset();
    setMessage("Utilisateur créé");
    await load();
  }

  async function toggleActive(id: number, isActive: boolean) {
    if (!session?.accessToken) return;
    await apiFetch(`/users/${id}/active`, {
      method: "PATCH",
      token: session.accessToken,
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes et rôles portail"
      />

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-cream bg-surface p-5 shadow-soft md:grid-cols-2"
      >
        <input name="name" required placeholder="Nom" className="rounded-xl border border-cream-soft px-3 py-2" />
        <input name="email" required type="email" placeholder="Email" className="rounded-xl border border-cream-soft px-3 py-2" />
        <input name="password" required type="password" minLength={8} placeholder="Mot de passe" className="rounded-xl border border-cream-soft px-3 py-2" />
        <input name="phone" placeholder="Téléphone" className="rounded-xl border border-cream-soft px-3 py-2" />
        <select name="role" required className="rounded-xl border border-cream-soft px-3 py-2">
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white">
          Créer
        </button>
      </form>

      {message ? <p className="text-sm font-medium text-gold">{message}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-cream bg-surface shadow-soft">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream-soft/60 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-cream">
                <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                <td className="px-4 py-3">{u.isActive ? "Actif" : "Inactif"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggleActive(u.id, u.isActive)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    {u.isActive ? "Désactiver" : "Activer"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
