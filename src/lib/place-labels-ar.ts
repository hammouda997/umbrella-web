/** French key → Arabic display label for governorates / common cities */
export const arabicPlaceLabels: Record<string, string> = {
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
  "La Marsa": "المرسى",
  Carthage: "قرطاج",
  "Le Bardo": "باردو",
  "La Goulette": "حلق الوادي",
  Hammamet: "الحمامات",
  "Ariana Ville": "أريانة المدينة",
  Ezzahra: "الزهراء",
  "Hammam Lif": "حمام الأنف",
  "La Soukra": "سكرة",
  Raoued: "رواد",
  "Djerba Midoun": "جربة ميدون",
  "Djerba Houmet Essouk": "جربة حومة السوق",
};

export function bilingualLabel(french: string, governorateKey?: string): string {
  const ar =
    arabicPlaceLabels[french] ??
    (governorateKey ? arabicPlaceLabels[governorateKey] : undefined);
  if (!ar) return french.replace(/_/g, " ");
  return `${french.replace(/_/g, " ")} · ${ar}`;
}
