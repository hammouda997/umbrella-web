"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      canCreate
      defaultOpenCreate
      title="Nouveau colis"
      description="Création type Navex (champs essentiels)"
    />
  );
}

export default function ExpediteurNouveauPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Chargement...</p>}>
      <Body />
    </Suspense>
  );
}
