export const DELIVERY_WINDOWS = [
  { id: "matin", label: "Matin", hint: "08:00 – 12:00" },
  { id: "apres-midi", label: "Après-midi", hint: "12:00 – 17:00" },
  { id: "soir", label: "Soir", hint: "17:00 – 21:00" },
  { id: "journee", label: "Toute la journée", hint: "08:00 – 21:00" },
] as const;

export type DeliveryWindowId = (typeof DELIVERY_WINDOWS)[number]["id"];
