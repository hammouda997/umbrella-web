"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PORTAL_BY_ROLE } from "@/lib/roles";
import { USE_MOCK } from "@/lib/mock-mode";

export default function SignupPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      if (USE_MOCK) {
        const session = await signIn(
          "expediteur@umbrella.tn",
          "Expediteur@12345",
        );
        router.replace(session.portal ?? PORTAL_BY_ROLE.EXPEDITEUR);
        return;
      }
      void form;
      setError("Inscription API à brancher — utilisez la connexion démo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-soft/40 px-4 py-12">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-cream bg-surface p-8 shadow-soft"
      >
        <p className="font-display text-3xl font-extrabold text-brand">
          Créer un compte
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Compte expéditeur Umbrella Express
          {USE_MOCK ? " · mode démo" : ""}
        </p>

        <label className="mt-6 block text-sm font-medium text-ink">
          Nom de la boutique
          <input
            name="name"
            required
            className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Téléphone
          <input
            name="phone"
            required
            pattern="[0-9]{8}"
            className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-ink">
          Mot de passe
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>

        {error ? <p className="mt-3 text-sm text-brand">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-soft disabled:opacity-60"
        >
          {loading ? "…" : USE_MOCK ? "Continuer en démo expéditeur" : "S’inscrire"}
        </button>

        <p className="mt-4 text-center text-sm text-ink-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
