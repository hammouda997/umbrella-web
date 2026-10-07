"use client";

import { useParams } from "next/navigation";
import { ParcelDetailView } from "@/components/ParcelDetailView";

export default function SupportParcelDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return (
    <ParcelDetailView
      parcelId={id}
      backHref="/support/parcels"
      portalBase="/support"
    />
  );
}
