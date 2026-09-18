"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      canCreate
      canEdit
      canDelete
      title="Mes colis"
      description="Tous vos envois"
      detailBasePath="/expediteur/parcels"
    />
  );
}

export default function ExpediteurParcelsPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Chargement...</p>}>
      <Body />
    </Suspense>
  );
}
