"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";

export default function CompteEnAttentePage() {
  return (
    <AuthLayout
      title="Compte en attente"
      subtitle="Votre inscription a bien été reçue. L’équipe Umbrella vérifie votre profil avant d’activer l’accès."
      footer={
        <>
          Déjà validé ?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Clock3 className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">
          Vous recevrez l’accès à votre espace une fois le compte approuvé. Si
          votre demande est refusée, contactez le support Umbrella Express.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
        >
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}
