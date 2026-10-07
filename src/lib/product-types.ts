export const PRODUCT_TYPES = [
  "Vêtements",
  "Chaussures",
  "Électronique",
  "Cosmétiques",
  "Accessoires",
  "Alimentaire",
  "Documents",
  "Autre",
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];
