"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      title={"Colis"}
      description={"Colis de votre agence"}
      detailBasePath={"/chef-agence/parcels"}
      canCreate
      canEdit
      canDelete
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className={"text-ink-muted"}>Chargement...</p>}>
      <Body />
    </Suspense>
  );
}

