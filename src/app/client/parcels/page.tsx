"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager title="Mes livraisons" description="Suivi destinataire" />
  );
}

export default function ClientParcelsPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Chargement...</p>}>
      <Body />
    </Suspense>
  );
}
