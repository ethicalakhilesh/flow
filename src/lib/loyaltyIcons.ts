import type { LoyaltyCategory } from "./types";

/**
 * Maps a loyalty program's brand (not its program name) to an icon URL —
 * e.g. key on "British Airways", not "Executive Club", so the icon is
 * shared correctly if a brand ever has more than one program. Keys are
 * normalized (lowercased, trimmed). A mapped value can be a local file
 * under public/icons/loyalty/ (.svg, .png, .jpg/.jpeg, .ico) or a
 * third-party URL. Unmapped brands fall back to a generic icon based on
 * category (airline / hotel / other) rather than one single default, since
 * a plane glyph for an unmapped airline reads better than a generic icon.
 *
 * To add a brand: either drop a file in public/icons/loyalty/ and point to
 * it, or paste a hosted URL — add one line below either way.
 *
 * Note: the 5 brands mapped below are placeholder monograms I generated
 * myself (same reasoning as bankIcons.ts) — not the airlines'/hotels'
 * actual logos. Swap in real ones you've sourced yourself when ready.
 */
export const LOYALTY_ICON_MAP: Record<string, string> = {
  "vistara": "/icons/loyalty/vistara.svg",
  "air india": "/icons/loyalty/air-india.svg",
  "marriott": "/icons/loyalty/marriott.svg",
  "ihg": "/icons/loyalty/ihg.svg",
  // Same file as the bank icon mapping — it's the same brand either way.
  "hdfc bank": "/icons/banks/hdfc.svg",
};

export const DEFAULT_LOYALTY_ICON_BY_CATEGORY: Record<LoyaltyCategory, string> = {
  airline: "/icons/loyalty/default-airline.svg",
  hotel: "/icons/loyalty/default-hotel.svg",
  other: "/icons/loyalty/default-other.svg",
};

/** Looks up the icon URL for a brand, falling back by category. */
export function getLoyaltyIconUrl(brand: string, category: LoyaltyCategory): string {
  const key = brand.trim().toLowerCase();
  return LOYALTY_ICON_MAP[key] ?? DEFAULT_LOYALTY_ICON_BY_CATEGORY[category];
}
