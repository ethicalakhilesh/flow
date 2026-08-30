import loyaltyData from "@/data/loyalty.json";
import type { LoyaltyCategory, LoyaltyProgram } from "@/lib/types";

export function getLoyaltyPrograms(): LoyaltyProgram[] {
  return loyaltyData as LoyaltyProgram[];
}

export const CATEGORY_LABEL: Record<LoyaltyCategory, string> = {
  airline: "Airlines",
  hotel: "Hotels",
  other: "Other Loyalty Programs",
};

export function groupByCategory(programs: LoyaltyProgram[]): Record<LoyaltyCategory, LoyaltyProgram[]> {
  return {
    airline: programs.filter((p) => p.category === "airline"),
    hotel: programs.filter((p) => p.category === "hotel"),
    other: programs.filter((p) => p.category === "other"),
  };
}

/** True if the expiry date falls within the next N days (default 90). */
export function isExpiringSoon(expiryDate?: string, withinDays = 90): boolean {
  if (!expiryDate) return false;
  const diffMs = new Date(expiryDate).getTime() - Date.now();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= withinDays;
}

export function formatExpiry(expiryDate?: string): string | null {
  if (!expiryDate) return null;
  return new Date(expiryDate).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
