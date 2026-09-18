export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "EXPEDITEUR"
  | "LIVREUR"
  | "CLIENT";

export const PORTAL_BY_ROLE: Record<AppRole, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  EXPEDITEUR: "/expediteur",
  LIVREUR: "/livreur",
  CLIENT: "/client",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EXPEDITEUR: "Expéditeur",
  LIVREUR: "Livreur",
  CLIENT: "Client",
};

/** Delivery channel (EXTERNAL / INTERNAL) is super-admin only. */
export function canSeeDeliveryMode(role?: AppRole | null): boolean {
  return role === "SUPER_ADMIN";
}
