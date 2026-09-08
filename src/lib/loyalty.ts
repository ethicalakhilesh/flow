import { fetchLoyaltyPrograms, fetchLoyaltyTransactions } from "@/lib/airtableData";
import type {
  LoyaltyCategory,
  LoyaltyProgram,
  LoyaltyTransaction,
} from "@/lib/types";

// The only two async functions in this file - call from a Server Component
// and pass results down; everything else here is a pure function over
// already-fetched arrays.

export async function getLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
  return fetchLoyaltyPrograms();
}

export async function getLoyaltyTransactions(): Promise<LoyaltyTransaction[]> {
  const transactions = await fetchLoyaltyTransactions();
  return transactions
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Pure lookup - pass in a programs array you already fetched. */
export function getProgramById(id: string, programs: LoyaltyProgram[]): LoyaltyProgram | undefined {
  return programs.find((p) => p.id === id);
}

/** Pure filter - pass in a transactions array you already fetched. */
export function getTransactionsForProgram(programId: string, transactions: LoyaltyTransaction[]): LoyaltyTransaction[] {
  return transactions.filter((t) => t.program_id === programId);
}

/**
 * Derived points balance for a program:
 *   current_balance = starting_balance + earned + adjusted (can be
 *   negative) − redeemed − expired − transferred
 * Mirrors accountBalance() in finance.ts for the same reason: the ledger
 * is the source of truth, balance is always computed on read.
 */
export function programBalance(program: LoyaltyProgram, transactions: LoyaltyTransaction[]): number {
  const delta = transactions
    .filter((t) => t.program_id === program.id)
    .reduce((sum, t) => {
      switch (t.type) {
        case "earned":
          return sum + t.points;
        case "adjusted":
          return sum + t.points; // can represent a correction in either direction
        case "redeemed":
        case "expired":
        case "transferred":
          return sum - t.points;
        default:
          return sum;
      }
    }, 0);
  return program.starting_balance + delta;
}

export interface LoyaltyProgramWithBalance extends LoyaltyProgram {
  points_balance: number;
}

/** Pure - pass in programs/transactions arrays you already fetched. */
export function getProgramsWithBalances(
  programs: LoyaltyProgram[],
  transactions: LoyaltyTransaction[]
): LoyaltyProgramWithBalance[] {
  return programs.map((p) => ({
    ...p,
    points_balance: programBalance(p, transactions),
  }));
}

export const CATEGORY_LABEL: Record<LoyaltyCategory, string> = {
  airline: "Airlines",
  hotel: "Hotels",
  other: "Other Loyalty Programs",
};

export function groupByCategory<T extends { category: LoyaltyCategory }>(
  programs: T[]
): Record<LoyaltyCategory, T[]> {
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

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

export function formatPoints(points: number): string {
  return points.toLocaleString("en-IN");
}

/** "CV1234567" -> "CV12 3456 7" — reads like a card number instead of a raw string. */
export function formatMemberId(memberId?: string): string {
  if (!memberId) return "";
  return memberId.replace(/(.{4})/g, "$1 ").trim();
}
