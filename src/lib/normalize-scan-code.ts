/**
 * HID wedges often emit US-QWERTY key positions while Windows is on FR-AZERTY,
 * producing codes like `U?B)LIFE)àà&` instead of `UMB-LIFE-001`.
 */
const AZERTY_FROM_US: Record<string, string> = {
  "&": "1",
  é: "2",
  '"': "3",
  "'": "4",
  "(": "5",
  // number-row `-` on AZERTY is US `6`; real barcode hyphens arrive as `)` instead
  è: "7",
  _: "8",
  ç: "9",
  à: "0",
  ")": "-",
  "°": "_",
  "?": "M",
  ",": "M",
  "\u00a7": "!",
};

const GARBLE_HINT = /[àâäéèêëïîôùûüç&°§?]|\)/;

export function looksLikeAzertyGarble(raw: string): boolean {
  return GARBLE_HINT.test(raw);
}

export function normalizeScanCode(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const mapped = trimmed
    .split("")
    .map((ch) => {
      if (ch === "-") return "-";
      return AZERTY_FROM_US[ch] ?? ch;
    })
    .join("");

  return mapped.toUpperCase();
}

/** Unique lookup candidates — raw first, then AZERTY-corrected when needed. */
export function scanCodeCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const out = [trimmed];
  if (looksLikeAzertyGarble(trimmed)) {
    const normalized = normalizeScanCode(trimmed);
    if (normalized && normalized !== trimmed) out.push(normalized);
  }
  const upper = trimmed.toUpperCase();
  if (!out.includes(upper)) out.push(upper);
  return out;
}
