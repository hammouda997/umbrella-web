"use client";

import { useParams } from "next/navigation";
import { ParcelDetailView } from "@/components/ParcelDetailView";

export default function ChefAgenceParcelDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return (
    <ParcelDetailView
      parcelId={id}
      backHref="/chef-agence/parcels"
      portalBase="/chef-agence"
    />
  );
}
