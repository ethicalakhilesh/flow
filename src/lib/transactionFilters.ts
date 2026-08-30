import type { Account, AccountType, Category, Transaction } from "@/lib/types";

export type SourceFilter = "all" | "bank" | "credit_card";
export type TypeFilter = "all" | "credit" | "debit" | "transfer";
export type DateMode = "none" | "specific" | "around" | "range";
export type AmountMode = "none" | "exact" | "range";

/** Which account types count as "Bank Account" vs "Credit Card" for the Source filter. */
const SOURCE_ACCOUNT_TYPES: Record<Exclude<SourceFilter, "all">, AccountType[]> = {
  bank: ["bank", "savings", "cash", "wallet"],
  credit_card: ["credit_card"],
};

export interface TransactionFilters {
  type: TypeFilter;
  source: SourceFilter;
  /** Empty = every account eligible under the current source. */
  accountIds: string[];
  date: {
    mode: DateMode;
    specificDate?: string;
    aroundDate?: string;
    aroundDays?: number;
    rangeStart?: string;
    rangeEnd?: string;
  };
  amount: {
    mode: AmountMode;
    exact?: number;
    min?: number;
    max?: number;
  };
  /** Empty = every category. */
  categoryIds: string[];
}

export const DEFAULT_FILTERS: TransactionFilters = {
  type: "all",
  source: "all",
  accountIds: [],
  date: { mode: "none" },
  amount: { mode: "none" },
  categoryIds: [],
};

export function eligibleAccountsForSource(accounts: Account[], source: SourceFilter): Account[] {
  if (source === "all") return accounts;
  const types = SOURCE_ACCOUNT_TYPES[source];
  return accounts.filter((a) => types.includes(a.type));
}

function matchesType(t: Transaction, type: TypeFilter): boolean {
  if (type === "all") return true;
  if (type === "transfer") return t.type === "transfer";
  return type === "credit" ? t.type === "income" : t.type === "expense";
}

function matchesAccount(t: Transaction, accounts: Account[], source: SourceFilter, accountIds: string[]): boolean {
  if (source === "all" && accountIds.length === 0) return true;
  const eligible = eligibleAccountsForSource(accounts, source).map((a) => a.id);
  const allowed = accountIds.length > 0 ? accountIds.filter((id) => eligible.includes(id)) : eligible;
  return allowed.includes(t.account_id);
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function matchesDate(t: Transaction, date: TransactionFilters["date"]): boolean {
  if (date.mode === "none") return true;
  const txnDate = new Date(t.date);

  if (date.mode === "specific") {
    if (!date.specificDate) return true;
    return t.date === date.specificDate;
  }
  if (date.mode === "around") {
    if (!date.aroundDate) return true;
    const center = new Date(date.aroundDate);
    const window = date.aroundDays ?? 0;
    return daysBetween(txnDate, center) <= window;
  }
  if (date.mode === "range") {
    if (!date.rangeStart && !date.rangeEnd) return true;
    if (date.rangeStart && txnDate < new Date(date.rangeStart)) return false;
    if (date.rangeEnd && txnDate > new Date(date.rangeEnd)) return false;
    return true;
  }
  return true;
}

function matchesAmount(t: Transaction, amount: TransactionFilters["amount"]): boolean {
  if (amount.mode === "none") return true;
  if (amount.mode === "exact") {
    if (amount.exact === undefined) return true;
    return t.amount === amount.exact;
  }
  if (amount.mode === "range") {
    if (amount.min !== undefined && t.amount < amount.min) return false;
    if (amount.max !== undefined && t.amount > amount.max) return false;
    return true;
  }
  return true;
}

function matchesCategory(t: Transaction, categoryIds: string[]): boolean {
  if (categoryIds.length === 0) return true;
  return categoryIds.includes(t.category_id);
}

/**
 * Applies every filter to the transaction list. Pass `excludeCategory` to
 * ignore the category filter itself — used to compute which categories
 * still have matches under the *other* active filters (see
 * getAvailableCategories below), so the Category picker never offers an
 * option that would return zero results.
 */
export function applyFilters(
  transactions: Transaction[],
  accounts: Account[],
  filters: TransactionFilters,
  options: { excludeCategory?: boolean } = {}
): Transaction[] {
  return transactions.filter((t) => {
    if (!matchesType(t, filters.type)) return false;
    if (!matchesAccount(t, accounts, filters.source, filters.accountIds)) return false;
    if (!matchesDate(t, filters.date)) return false;
    if (!matchesAmount(t, filters.amount)) return false;
    if (!options.excludeCategory && !matchesCategory(t, filters.categoryIds)) return false;
    return true;
  });
}

/** Categories that have at least one transaction matching every filter except category itself. */
export function getAvailableCategories(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  filters: TransactionFilters
): Category[] {
  const matched = applyFilters(transactions, accounts, filters, { excludeCategory: true });
  const presentIds = new Set(matched.map((t) => t.category_id));
  return categories.filter((c) => presentIds.has(c.id));
}

export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;
  if (filters.type !== "all") count++;
  if (filters.source !== "all") count++;
  if (filters.accountIds.length > 0) count++;
  if (filters.date.mode !== "none") count++;
  if (filters.amount.mode !== "none") count++;
  if (filters.categoryIds.length > 0) count++;
  return count;
}
