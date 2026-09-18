import { PageHeader, Panel } from "@/components/ui";

const ROWS = [
  { zone: "Grand Tunis", price: "7 DT", delay: "24–48h" },
  { zone: "Sahel (Sousse / Monastir)", price: "8 DT", delay: "24–72h" },
  { zone: "Sfax & Sud", price: "9 DT", delay: "48–72h" },
  { zone: "Intérieur", price: "10 DT", delay: "48–96h" },
];

export default function TarifsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <PageHeader
        title="Tarifs"
        description="Grille indicative — mode démo. Les tarifs réels dépendent du contrat."
      />
      <Panel className="mt-8 overflow-hidden p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-cream-soft/70 text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">À partir de</th>
              <th className="px-4 py-3">Délai</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.zone} className="border-t border-cream-soft">
                <td className="px-4 py-3 font-medium text-ink">{r.zone}</td>
                <td className="px-4 py-3">{r.price}</td>
                <td className="px-4 py-3 text-ink-muted">{r.delay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </main>
  );
}
