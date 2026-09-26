"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2, Clock3, Mail, MapPin, Phone, Send } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, TextAreaField, TextField, buttonClass } from "@/components/ui";

const CHANNELS = [
  { icon: Phone, label: "Téléphone", value: "+216 25 025 073", href: "tel:+21625025073" },
  { icon: Mail, label: "Email", value: "support@umbrella.tn", href: "mailto:support@umbrella.tn" },
  { icon: MapPin, label: "Adresse", value: "Tunis, Tunisie" },
  { icon: Clock3, label: "Horaires", value: "Lun–Sam · 9h–18h" },
];

export default function ContactPage() {
  const [sentName, setSentName] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Contact site — ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name} · ${email}`);
    window.location.href = `mailto:support@umbrella.tn?subject=${subject}&body=${body}`;
    setSentName(name);
  }

  return (
    <AuthLayout
      title="Contact"
      subtitle="Une question sur vos livraisons ? L'équipe Umbrella vous répond."
      footer={
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Accéder à mon espace
        </Link>
      }
    >
      <ul className="mb-8 grid gap-3 sm:grid-cols-2">
        {CHANNELS.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex items-center gap-3 rounded-xl border border-cream bg-surface px-3 py-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] uppercase tracking-wide text-ink-muted">{label}</span>
              {href ? (
                <a href={href} className="block truncate text-sm font-semibold text-ink hover:text-brand">
                  {value}
                </a>
              ) : (
                <span className="block truncate text-sm font-semibold text-ink">{value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {sentName ? (
        <div className="rounded-2xl border border-cream bg-surface p-6 text-center shadow-soft">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" aria-hidden />
          <p className="mt-3 font-display text-lg font-bold text-ink">Merci {sentName} !</p>
          <p className="mt-1 text-sm text-ink-muted">
            Votre message est prêt dans votre messagerie. Déjà client ? Ouvrez un ticket depuis votre espace
            pour un suivi plus rapide.
          </p>
          <button type="button" onClick={() => setSentName(null)} className={`${buttonClass("secondary")} mt-4`}>
            Nouveau message
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <TextField name="name" label="Nom" required autoComplete="name" />
          <TextField name="email" type="email" label="Email" required autoComplete="email" />
          <TextAreaField name="message" label="Message" required rows={4} wrapperClassName="sm:col-span-2" />
          <Button type="submit" icon={Send} className="w-full sm:col-span-2">
            Envoyer
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
