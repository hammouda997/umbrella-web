/**
 * Code 128B → SVG for scannable bordereau barcodes (HENEX cradle / HID wedge).
 */

const PATTERNS: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213",
  "122312", "132212", "221213", "221312", "231212", "112232", "122132",
  "122231", "113222", "123122", "123221", "223211", "221132", "221231",
  "213212", "223112", "312131", "311222", "321122", "321221", "312212",
  "322112", "322211", "212123", "212321", "232121", "111323", "131123",
  "131321", "112313", "132113", "132311", "211313", "231113", "231311",
  "112133", "112331", "132131", "113123", "113321", "133121", "313121",
  "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111",
  "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114",
  "413111", "241112", "134111", "111242", "121142", "121241", "114212",
  "124112", "124211", "411212", "421112", "421211", "212141", "214121",
  "412121", "111143", "111341", "131141", "114113", "114311", "411113",
  "411311", "113141", "114131", "311141", "411131", "211412", "211214",
  "211232", "2331112",
];

const START_B = 104;
const STOP = 106;

function encodeCode128B(value: string): number[] {
  const codes = [START_B];
  let checksum = START_B;
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);
    if (ch < 32 || ch > 126) {
      throw new Error(`Code128B cannot encode char code ${ch}`);
    }
    const code = ch - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }
  codes.push(checksum % 103);
  codes.push(STOP);
  return codes;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Returns SVG markup for a Code128B barcode of `value`. */
export function code128Svg(
  value: string,
  options?: { height?: number; moduleWidth?: number; includeText?: boolean },
): string {
  const text = value.trim();
  if (!text) return "";

  const height = options?.height ?? 64;
  const moduleWidth = options?.moduleWidth ?? 1.6;
  const includeText = options?.includeText ?? true;

  const codes = encodeCode128B(text);
  let x = 10;
  const bars: string[] = [];

  for (const code of codes) {
    const pattern = PATTERNS[code];
    if (!pattern) throw new Error(`Missing Code128 pattern for ${code}`);
    let drawBar = true;
    for (const digit of pattern) {
      const w = Number(digit) * moduleWidth;
      if (drawBar) {
        bars.push(
          `<rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${height}" fill="#1A1414"/>`,
        );
      }
      x += w;
      drawBar = !drawBar;
    }
  }

  const width = x + 10;
  const textH = includeText ? 18 : 0;
  const label = includeText
    ? `<text x="${(width / 2).toFixed(2)}" y="${height + 14}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="#1A1414">${escapeXml(text)}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(0)}" height="${height + textH}" viewBox="0 0 ${width.toFixed(2)} ${height + textH}" role="img" aria-label="Code-barres ${escapeXml(text)}">${bars.join("")}${label}</svg>`;
}

/** Data-URL for embedding in print HTML. */
export function code128DataUrl(value: string): string {
  const svg = code128Svg(value, { height: 56, moduleWidth: 1.5 });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
