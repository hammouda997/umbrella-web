"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      canCreate
      canEdit
      canDelete
      title="Tous les colis"
      description="Périmètre plateforme"
      detailBasePath="/super-admin/parcels"
    />
  );
}

export default function SuperAdminParcelsPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Chargement...</p>}>
      <Body />
    </Suspense>
  );
}
