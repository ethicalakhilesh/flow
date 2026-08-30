import type { LoyaltyCategory } from "./types";

/**
 * Maps a loyalty program name to an icon URL. Keys are normalized
 * (lowercased, trimmed). A mapped value can be a local file under
 * public/icons/loyalty/ (.svg, .png, .jpg/.jpeg, .ico) or a third-party
 * URL. Unmapped programs fall back to a generic icon based on category
 * (airline / hotel / other) rather than one single default, since a plane
 * glyph for an unmapped airline reads better than a generic card icon.
 *
 * To add a program: either drop a file in public/icons/loyalty/ and point
 * to it, or paste a hosted URL — add one line below either way.
 */
export const LOYALTY_ICON_MAP: Record<string, string> = {
  // Add real program logos here as you add memberships, e.g.:
  // "united mileageplus": "/icons/loyalty/united.svg",
  // "marriott bonvoy": "https://cdn.example.com/marriott.png",
};

export const DEFAULT_LOYALTY_ICON_BY_CATEGORY: Record<LoyaltyCategory, string> = {
  airline: "/icons/loyalty/default-airline.svg",
  hotel: "/icons/loyalty/default-hotel.svg",
  other: "/icons/loyalty/default-other.svg",
};

/** Looks up the icon URL for a loyalty program, falling back by category. */
export function getLoyaltyIconUrl(programName: string, category: LoyaltyCategory): string {
  const key = programName.trim().toLowerCase();
  return LOYALTY_ICON_MAP[key] ?? DEFAULT_LOYALTY_ICON_BY_CATEGORY[category];
}
