import { PageHeader, Panel } from "@/components/ui";

export default function LegalPage({
  params,
}: {
  params: { slug: string };
}) {
  const titles: Record<string, string> = {
    cgu: "Conditions générales",
    confidentialite: "Confidentialité",
    mentions: "Mentions légales",
  };
  const title = titles[params.slug] ?? "Informations légales";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <PageHeader title={title} description="Document indicatif — mode démo" />
      <Panel className="mt-8 space-y-3 text-sm leading-relaxed text-ink-muted">
        <p>
          Umbrella Express propose des services de livraison pour commerçants
          e-commerce en Tunisie. Ce texte est un placeholder design ; le contenu
          juridique définitif sera fourni avant mise en production.
        </p>
        <p>
          Pour toute demande : support@umbrella.tn · +216 25 025 073.
        </p>
      </Panel>
    </main>
  );
}
