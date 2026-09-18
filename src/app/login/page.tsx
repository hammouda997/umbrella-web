"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PORTAL_BY_ROLE } from "@/lib/roles";
import { USE_MOCK } from "@/lib/mock-mode";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await signIn(email, password);
      const next = searchParams.get("next");
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const portal =
        safeNext ??
        session.portal ??
        PORTAL_BY_ROLE[session.user.role] ??
        "/login";
      router.replace(portal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md rounded-2xl border border-cream bg-surface/90 p-8 shadow-soft backdrop-blur"
    >
      <p className="font-display text-3xl text-brand">Umbrella Express</p>
      <p className="mt-2 text-sm text-ink-muted">
        Connexion portail
        {USE_MOCK ? " · mode démo" : ""}
      </p>

      <label className="mt-8 block text-sm font-medium text-ink">
        Email
        <input
          className="mt-1.5 w-full rounded-xl border border-cream-soft bg-cream-soft/30 px-3 py-2.5 outline-none ring-brand focus:ring-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="username"
          required
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-ink">
        Mot de passe
        <input
          className="mt-1.5 w-full rounded-xl border border-cream-soft bg-cream-soft/30 px-3 py-2.5 outline-none ring-brand focus:ring-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? <p className="mt-3 text-sm text-brand-soft">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-soft disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      <p className="mt-4 text-center text-sm text-ink-muted">
        <Link href="/forgot-password" className="hover:text-brand">
          Mot de passe oublié
        </Link>
        {" · "}
        <Link href="/signup" className="font-semibold text-brand hover:underline">
          Créer un compte
        </Link>
      </p>

      {USE_MOCK ? (
        <div className="mt-6 space-y-2 border-t border-cream-soft pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Comptes démo
          </p>
          {[
            ["admin@umbrella.tn", "Admin@12345", "Admin"],
            ["expediteur@umbrella.tn", "Expediteur@12345", "Expéditeur"],
            ["livreur@umbrella.tn", "Livreur@12345", "Livreur"],
            ["client@umbrella.tn", "Client@12345", "Client"],
            ["super@umbrella.tn", "Super@12345", "Super"],
          ].map(([em, pw, label]) => (
            <button
              key={em}
              type="button"
              onClick={() => fillDemo(em, pw)}
              className="flex w-full items-center justify-between rounded-lg border border-cream-soft px-3 py-2 text-left text-xs hover:border-brand"
            >
              <span className="font-medium text-ink">{label}</span>
              <span className="text-ink-muted">{em}</span>
            </button>
          ))}
        </div>
      ) : null}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={<p className="text-sm text-ink-muted">Chargement…</p>}
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
