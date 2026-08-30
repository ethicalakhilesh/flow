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
 */
export const LOYALTY_ICON_MAP: Record<string, string> = {
  // Add real brand logos here as you add memberships, e.g.:
  // "british airways": "/icons/loyalty/british-airways.svg",
  // "marriott": "https://cdn.example.com/marriott.png",
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
