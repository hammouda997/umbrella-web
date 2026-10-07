"use client";

import { ZonesManager } from "@/components/ZonesManager";

export default function LivreurZonesPage() {
  return (
    <ZonesManager
      canCreate
      canDelete={false}
      title="Mes zones de tournée"
      description="Définissez vos secteurs de livraison (centre + rayon) pour organiser vos déplacements."
    />
  );
}
