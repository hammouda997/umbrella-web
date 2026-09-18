"use client";

import { useParams } from "next/navigation";
import { ParcelDetailView } from "@/components/ParcelDetailView";

export default function SuperAdminParcelDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return (
    <ParcelDetailView
      parcelId={id}
      backHref="/super-admin/parcels"
      portalBase="/super-admin"
    />
  );
}
