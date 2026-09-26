import generated from "@/data/tunisia-ar.json";

const GENERATED = generated as Record<string, string>;

export const arabicPlaceLabels: Record<string, string> = {
  ...GENERATED,
  Tunis: "تونس",
  Ariana: "أريانة",
  Beja: "باجة",
  Ben_Arous: "بن عروس",
  "Ben Arous": "بن عروس",
  Bizerte: "بنزرت",
  Gabes: "قابس",
  Gafsa: "قفصة",
  Jendouba: "جندوبة",
  Kairouan: "القيروان",
  Kasserine: "القصرين",
  Kebili: "قبلي",
  Le_Kef: "الكاف",
  "Le Kef": "الكاف",
  Mahdia: "المهدية",
  La_Manouba: "منوبة",
  "La Manouba": "منوبة",
  Medenine: "مدنين",
  Monastir: "المنستير",
  Nabeul: "نابل",
  Sfax: "صفاقس",
  Sidi_Bouzid: "سيدي بوزيد",
  "Sidi Bouzid": "سيدي بوزيد",
  Siliana: "سليانة",
  Sousse: "سوسة",
  Tataouine: "تطاوين",
  Tozeur: "توزر",
  Zaghouan: "زغوان",
  "Ariana Ville": "أريانة المدينة",
  "La Soukra": "سكرة",
  "Le Bardo": "باردو",
};

export function bilingualLabel(french: string, governorateKey?: string): string {
  const display = french.replace(/_/g, " ");
  const ar =
    arabicPlaceLabels[french] ??
    arabicPlaceLabels[display] ??
    (governorateKey && display === governorateKey.replace(/_/g, " ")
      ? arabicPlaceLabels[governorateKey]
      : undefined);
  if (!ar) return display;
  return `${display} · ${ar}`;
}

export function arabicForPlace(french: string): string | undefined {
  return arabicPlaceLabels[french] ?? arabicPlaceLabels[french.replace(/_/g, " ")];
}
