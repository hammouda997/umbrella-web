"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      returnsOnly
      title={"Retours"}
      description={"Vérification des retours — expéditeur et livreur visibles"}
      detailBasePath={"/support/parcels"}
      showPartyDetails
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
