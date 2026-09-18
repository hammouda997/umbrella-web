"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      canCreate
      canEdit
      canDelete
      title="Colis"
      description="Tous les colis plateforme"
      detailBasePath="/admin/parcels"
    />
  );
}

export default function AdminParcelsPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Chargement...</p>}>
      <Body />
    </Suspense>
  );
}
