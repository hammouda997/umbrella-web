"use client";

import { PaymentsManager } from "@/components/PaymentsManager";

export default function AdminPaymentsPage() {
  return <PaymentsManager canCreate canModerate />;
}
