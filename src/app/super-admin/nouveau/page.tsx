"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      canCreate
      defaultOpenCreate
      title="Nouveau colis"
      description="Création super-admin — EXTERNAL Navex ou INTERNAL (réservé)"
      detailBasePath="/super-admin/parcels"
    />
  );
}

export default function SuperAdminNouveauPage() {
  return (
    <Suspense fallback={<p className="text-ink-muted">Chargement...</p>}>
      <Body />
    </Suspense>
  );
}
