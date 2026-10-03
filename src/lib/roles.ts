export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CHEF_AGENCE"
  | "SUPPORT"
  | "PICKUP"
  | "MAGASINIER"
  | "EXPEDITEUR"
  | "LIVREUR"
  | "CLIENT";

export const PORTAL_BY_ROLE: Record<AppRole, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/admin",
  CHEF_AGENCE: "/chef-agence",
  SUPPORT: "/support",
  PICKUP: "/pickup",
  MAGASINIER: "/magasinier",
  EXPEDITEUR: "/expediteur",
  LIVREUR: "/livreur",
  CLIENT: "/client",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CHEF_AGENCE: "Chef d'agence",
  SUPPORT: "Support",
  PICKUP: "Pickup",
  MAGASINIER: "Magasinier",
  EXPEDITEUR: "Expéditeur",
  LIVREUR: "Livreur",
  CLIENT: "Client",
};

export const AGENCY_ROLES: AppRole[] = [
  "CHEF_AGENCE",
  "SUPPORT",
  "PICKUP",
  "MAGASINIER",
];

/** Delivery channel (EXTERNAL / INTERNAL) is super-admin only. */
export function canSeeDeliveryMode(role?: AppRole | null): boolean {
  return role === "SUPER_ADMIN";
}

export function roleNeedsAgency(role: AppRole): boolean {
  return AGENCY_ROLES.includes(role);
}
