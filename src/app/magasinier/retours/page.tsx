"use client";

import { Suspense } from "react";
import { ParcelsManager } from "@/components/ParcelsManager";

function Body() {
  return (
    <ParcelsManager
      returnsOnly
      title={"Retours à préparer"}
      description={"Préparer et mettre prêts les retours dépôt"}
      detailBasePath={"/magasinier/parcels"}
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
