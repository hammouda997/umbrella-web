"use client";

import { useParams } from "next/navigation";
import { ParcelDetailView } from "@/components/ParcelDetailView";

export default function ExpediteurParcelDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  return <ParcelDetailView parcelId={id} backHref="/expediteur/parcels" portalBase="/expediteur" />;
}
