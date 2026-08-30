/**
 * Maps a merchant/payee name to an icon URL. Keys are normalized
 * (lowercased, trimmed). A mapped value can be a local file under
 * public/icons/merchants/ (.svg, .png, .jpg/.jpeg, .ico) or a third-party
 * URL.
 *
 * Unlike banks and loyalty programs, there's no single sensible fallback
 * icon for an unmapped merchant — a generic "shop" glyph adds nothing a
 * category icon doesn't already convey. So an unmapped merchant returns
 * `null` here, and the caller (see MerchantIcon.tsx) falls back to the
 * transaction's category icon instead, which is what already rendered
 * before merchant icons existed.
 *
 * To add a merchant: either drop a file in public/icons/merchants/ and
 * point to it, or paste a hosted URL — add one line below either way.
 */
export const MERCHANT_ICON_MAP: Record<string, string> = {
  // "starbucks": "/icons/merchants/starbucks.svg",
  // "amazon": "https://cdn.example.com/amazon.png",
};

/** Used only if a *mapped* merchant's URL 404s or fails to load. */
export const DEFAULT_MERCHANT_ICON = "/icons/merchants/default.svg";

/** Looks up the icon URL for a merchant. Returns null if unmapped. */
export function getMerchantIconUrl(merchant?: string): string | null {
  if (!merchant) return null;
  const key = merchant.trim().toLowerCase();
  return MERCHANT_ICON_MAP[key] ?? null;
}
