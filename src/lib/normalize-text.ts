const ACCENT_MAP: Record<string, string> = {
  à: "a",
  â: "a",
  ä: "a",
  á: "a",
  ã: "a",
  å: "a",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  ö: "o",
  õ: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
  æ: "ae",
  œ: "oe",
};

export function foldAccents(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[àâäáãåçèéêëìíîïñòóôöõùúûüýÿæœ]/gi, (ch) => {
      const mapped = ACCENT_MAP[ch.toLowerCase()];
      if (!mapped) return ch;
      return ch === ch.toUpperCase() ? mapped.toUpperCase() : mapped;
    });
}

export function normalizeSearch(value: string): string {
  return foldAccents(value)
    .toLowerCase()
    .replace(/[_'’`]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function displayGovernorate(key: string): string {
  return key.replace(/_/g, " ");
}
