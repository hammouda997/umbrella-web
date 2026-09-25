import { normalizeSearch } from "@/lib/normalize-text";

export type AddressQuality = {
  score: number;
  level: "weak" | "ok" | "strong";
  warnings: string[];
};

const STREET_HINT =
  /\b(rue|av\.?|avenue|route|boulevard|bd\.?|impasse|all[eé]e|cit[eé]|zone|immeuble|imm\.?|r[eé]sidence|num[eé]ro|n[°o]|km)\b/i;
const DIGIT = /\d/;

export function scoreAddress(input: {
  governorate: string;
  city: string;
  locality?: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}): AddressQuality {
  const warnings: string[] = [];
  let score = 0;

  if (input.governorate) score += 20;
  else warnings.push("Gouvernorat manquant");

  if (input.city) score += 20;
  else warnings.push("Ville manquante");

  const street = input.address.trim();
  if (!street) {
    warnings.push("Adresse complète manquante");
  } else if (street.length < 8) {
    warnings.push("Adresse trop courte — ajoutez rue / numéro / repère");
    score += 5;
  } else {
    score += 25;
    if (STREET_HINT.test(street) || DIGIT.test(street)) score += 15;
    else warnings.push("Précisez la rue ou un numéro pour faciliter la livraison");
  }

  if (input.locality?.trim()) score += 10;

  if (input.lat != null && input.lng != null) score += 20;
  else warnings.push("Pas de GPS — utilisez « Ma position » ou la carte");

  const level: AddressQuality["level"] =
    score >= 75 ? "strong" : score >= 45 ? "ok" : "weak";

  return {
    score: Math.min(100, score),
    level,
    warnings,
  };
}

export function isVagueAddress(address: string): boolean {
  const n = normalizeSearch(address);
  return n.length > 0 && n.length < 8 && !DIGIT.test(address);
}
