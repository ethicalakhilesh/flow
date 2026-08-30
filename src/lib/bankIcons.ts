/**
 * Maps a bank/institution name to an icon. Keys are normalized
 * (lowercased, trimmed) so lookups are forgiving of casing.
 *
 * A mapped value can be any of:
 *   - a local file under public/icons/banks/ (.svg, .png, .jpg/.jpeg, .ico)
 *   - a third-party URL, e.g. "https://cdn.example.com/hdfc-logo.png"
 *
 * To add a new bank: either drop a file in public/icons/banks/ and point to
 * it, or paste a hosted URL directly — add one line below either way.
 * Nothing else needs to change; AccountCard renders whatever URL comes back.
 */
export const BANK_ICON_MAP: Record<string, string> = {
  "hdfc bank": "/icons/banks/hdfc.png",
  "hdfc":  "/icons/banks/hdfc.png",
  "icici bank": "https://www.icici.bank.in/favicon.ico",
  "icici": "https://www.icici.bank.in/favicon.ico",
  "axis bank": "https://www.axis.bank.in/favicon.ico",
  "axis": "https://www.axis.bank.in/favicon.ico",
  "idfc bank": "/icons/banks/idfc-first.svg",
  "idfc first bank": "/icons/banks/idfc-first.svg",
  "idfc": "/icons/banks/idfc-first.svg",
  "federal bank": "/icons/banks/federal.svg",
  "federal": "/icons/banks/federal.svg",
};

export const DEFAULT_BANK_ICON = "/icons/banks/default.svg";

/** Looks up the icon URL for a bank name, falling back to a generic icon. */
export function getBankIconUrl(bankName?: string): string {
  if (!bankName) return DEFAULT_BANK_ICON;
  const key = bankName.trim().toLowerCase();
  return BANK_ICON_MAP[key] ?? DEFAULT_BANK_ICON;
}
