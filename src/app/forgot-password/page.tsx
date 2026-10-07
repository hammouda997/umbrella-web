"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { MailCheck, Send } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { errorText, useToast } from "@/components/Feedback";
import { Button, TextField, buttonClass } from "@/components/ui";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setBusy(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSentTo(email);
    } catch (err) {
      toast.error("Envoi impossible", errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Indiquez l'email de votre compte pour recevoir un lien de réinitialisation."
      footer={
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sentTo ? (
        <div className="rounded-2xl border border-cream bg-surface p-6 text-center shadow-soft">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <MailCheck className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-4 font-display text-lg font-bold text-ink">Demande enregistrée</p>
          <p className="mt-2 text-sm text-ink-muted">
            Si un compte existe pour <span className="font-semibold text-ink">{sentTo}</span>, un
            lien sera envoyé dès que l’envoi d’emails sera configuré. En attendant, contactez le
            support pour réinitialiser votre accès.
          </p>
          <Link href="/contact" className={`${buttonClass("secondary")} mt-5`}>
            Contacter le support
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <TextField name="email" type="email" label="Email" autoComplete="email" required />
          <Button type="submit" icon={Send} className="w-full" loading={busy}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
