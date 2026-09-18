import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <PageHeader
        title="Contact"
        description="Une question sur vos livraisons ? Écrivez-nous."
      />
      <Panel className="mt-8 space-y-4">
        <p className="text-sm text-ink">
          <span className="font-semibold">Téléphone</span> ·{" "}
          <a href="tel:+21625025073" className="text-brand hover:underline">
            +216 25 025 073
          </a>
        </p>
        <p className="text-sm text-ink">
          <span className="font-semibold">Email</span> · support@umbrella.tn
        </p>
        <p className="text-sm text-ink-muted">
          Tunis, Tunisie · Lun–Sam 9h–18h
        </p>
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-soft"
        >
          Accéder à mon espace
        </Link>
      </Panel>
    </main>
  );
}
