"use client";

import { PaymentsManager } from "@/components/PaymentsManager";

export default function SuperAdminPaymentsPage() {
  return <PaymentsManager canCreate canModerate />;
}
