"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageHeader, Panel } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <PageHeader
        title="Mot de passe oublié"
        description="UI démo — aucun email n’est envoyé."
      />
      <Panel className="mt-8">
        {sent ? (
          <p className="text-sm text-ink">
            Si un compte existe, un lien de réinitialisation serait envoyé.
            <Link href="/login" className="mt-4 block font-semibold text-brand">
              Retour connexion
            </Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border border-cream-soft px-3 py-2.5 outline-none focus:border-brand"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-soft"
            >
              Envoyer le lien
            </button>
          </form>
        )}
      </Panel>
    </main>
  );
}
