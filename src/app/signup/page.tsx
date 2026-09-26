"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, ErrorBanner, TextField } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { PORTAL_BY_ROLE } from "@/lib/roles";

type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "confirm", string>>;

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const next: Errors = {};
    if (name.length < 2) next.name = "Nom de la boutique requis";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Email invalide";
    if (!/^[0-9]{8}$/.test(phone)) next.phone = "8 chiffres";
    if (password.length < 8) next.password = "8 caractères minimum";
    if (confirm !== password) next.confirm = "Les mots de passe ne correspondent pas";
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const session = await signUp({ name, email, phone, password });
      router.replace(session.portal ?? PORTAL_BY_ROLE.EXPEDITEUR);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Compte expéditeur — commencez à envoyer vos colis en quelques minutes."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          label="Nom de la boutique"
          autoComplete="organization"
          error={errors.name}
          wrapperClassName="sm:col-span-2"
        />
        <TextField name="email" type="email" label="Email" autoComplete="email" error={errors.email} />
        <TextField
          name="phone"
          label="Téléphone"
          inputMode="numeric"
          placeholder="8 chiffres"
          autoComplete="tel"
          error={errors.phone}
        />
        <TextField
          name="password"
          type="password"
          label="Mot de passe"
          autoComplete="new-password"
          hint="8 caractères minimum"
          error={errors.password}
        />
        <TextField
          name="confirm"
          type="password"
          label="Confirmation"
          autoComplete="new-password"
          error={errors.confirm}
        />
        {error ? (
          <div className="sm:col-span-2">
            <ErrorBanner message={error} />
          </div>
        ) : null}
        <Button type="submit" icon={UserPlus} loading={loading} className="w-full sm:col-span-2">
          Créer mon compte
        </Button>
      </form>
    </AuthLayout>
  );
}
