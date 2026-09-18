import { PageHeader, Panel } from "@/components/ui";

const FAQ = [
  {
    q: "Comment créer un colis ?",
    a: "Connectez-vous en expéditeur, ouvrez « Ajouter colis » et renseignez destinataire, adresse et prix COD.",
  },
  {
    q: "Comment suivre un colis ?",
    a: "Utilisez /track avec le code bordereau, ou consultez votre portail.",
  },
  {
    q: "Quand suis-je payé ?",
    a: "Demandez un paiement sur les colis livrés depuis l’espace Paiements.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <PageHeader title="FAQ" description="Questions fréquentes" />
      <div className="mt-8 space-y-3">
        {FAQ.map((item) => (
          <Panel key={item.q}>
            <h2 className="font-display text-lg font-bold text-ink">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.a}</p>
          </Panel>
        ))}
      </div>
    </main>
  );
}
