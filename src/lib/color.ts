function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}

/** Multiplies each RGB channel by `factor` (<1 darkens, >1 lightens). */
function shade(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * factor, g * factor, b * factor]);
}

/**
 * Builds a 3-stop diagonal gradient from a single base color, so every
 * program only needs to store one hex value (`card_color`) rather than a
 * full gradient definition.
 */
export function buildCardGradient(baseHex: string): string {
  const dark = shade(baseHex, 0.65);
  const light = shade(baseHex, 1.35);
  return `linear-gradient(135deg, ${dark} 0%, ${baseHex} 45%, ${light} 100%)`;
}
