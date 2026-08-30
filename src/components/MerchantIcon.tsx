import type { Category } from "@/lib/types";
import { getMerchantIconUrl, DEFAULT_MERCHANT_ICON } from "@/lib/merchantIcons";
import CategoryIcon from "./CategoryIcon";
import BrandLogo from "./BrandLogo";

/**
 * Icon shown next to a transaction. If the transaction's merchant is in
 * MERCHANT_ICON_MAP, shows that logo (squircle, like bank/loyalty icons).
 * Otherwise falls back to the existing category icon (circle glyph) —
 * exactly what rendered for every transaction before merchant icons
 * existed, so unmapped merchants look no different than today.
 */
export default function MerchantIcon({
  merchant,
  category,
}: {
  merchant?: string;
  category?: Category;
}) {
  const iconUrl = getMerchantIconUrl(merchant);

  if (iconUrl) {
    return <BrandLogo src={iconUrl} fallbackSrc={DEFAULT_MERCHANT_ICON} size={36} />;
  }

  return <CategoryIcon icon={category?.icon ?? "dots"} color={category?.color ?? "#8A9694"} />;
}
