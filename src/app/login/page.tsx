"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, ErrorBanner, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { PORTAL_BY_ROLE } from "@/lib/roles";

const DEMO_ACCOUNTS = [
  { email: "admin@umbrella.tn", password: "Admin@12345", label: "Admin" },
  { email: "expediteur@umbrella.tn", password: "Expediteur@12345", label: "Expéditeur" },
  { email: "livreur@umbrella.tn", password: "Livreur@12345", label: "Livreur" },
  { email: "client@umbrella.tn", password: "Client@12345", label: "Client" },
  { email: "super@umbrella.tn", password: "Super@12345", label: "Super admin" },
] as const;

function LoginForm() {
  const { signIn, isMock } = useAuth();
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
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.replace(safeNext ?? session.portal ?? PORTAL_BY_ROLE[session.user.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Connexion"
      subtitle={`Accédez à votre espace Umbrella Express${isMock ? " · mode démo" : ""}`}
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            Créer un compte expéditeur
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm text-ink-muted hover:text-brand">
            Mot de passe oublié ?
          </Link>
        </div>
        {error ? <ErrorBanner message={error} /> : null}
        <Button type="submit" icon={LogIn} loading={loading} className="w-full">
          Se connecter
        </Button>
      </form>

      <div className="mt-8 rounded-2xl border border-cream bg-cream-soft/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Comptes de démonstration
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => {
                setEmail(acc.email);
                setPassword(acc.password);
                setError(null);
              }}
              className="rounded-xl border border-cream bg-surface px-3 py-2 text-left transition hover:border-brand"
            >
              <span className="block text-sm font-semibold text-ink">{acc.label}</span>
              <span className="block truncate text-[11px] text-ink-muted">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-ink-muted">Chargement…</p>}>
      <LoginForm />
    </Suspense>
  );
}
