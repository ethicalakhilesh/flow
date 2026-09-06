import { fetchAccounts, fetchTransactions, fetchCategories } from "@/lib/airtableData";
import type {
  Account,
  AccountType,
  AccountWithBalance,
  Category,
  Transaction,
} from "@/lib/types";

// These three are the only async functions in this file - everything else
// is a pure function operating on arrays already fetched by a caller. Call
// these from a Server Component (or another async context) and pass the
// results down; never call them from a "use client" component directly.

export async function getAccounts(): Promise<Account[]> {
  return fetchAccounts();
}

export async function getTransactions(): Promise<Transaction[]> {
  const transactions = await fetchTransactions();
  return transactions.slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getCategories(): Promise<Category[]> {
  return fetchCategories();
}

/** Pure lookup - pass in a categories array you already fetched, rather than fetching here. */
export function getCategoryById(id: string, categories: Category[]): Category | undefined {
  return categories.find((c) => c.id === id);
}

/**
 * Derived balance for a single account:
 *   current_balance = initial_balance + income - expense ± transfers
 *
 * Transfers are stored as two linked rows (see Transaction.transfer_id in
 * types.ts) — this account's own row says which direction money moved for
 * *this* account via `transfer_direction`, so a credit card bill payment
 * correctly debits the bank account and credits the card in the same pass.
 */
export function accountBalance(account: Account, transactions: Transaction[]): number {
  const delta = transactions
    .filter((t) => t.account_id === account.id)
    .reduce((sum, t) => {
      if (t.type === "income") return sum + t.amount;
      if (t.type === "expense") return sum - t.amount;
      if (t.type === "transfer") {
        return t.transfer_direction === "in" ? sum + t.amount : sum - t.amount;
      }
      return sum;
    }, 0);
  return account.initial_balance + delta;
}

export async function getAccountsWithBalances(): Promise<AccountWithBalance[]> {
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);
  return accounts.map((a) => ({
    ...a,
    current_balance: accountBalance(a, transactions),
  }));
}

/** Groups accounts the same way the Accounts screen and Source filter do. */
export function getBankAccounts(accounts: AccountWithBalance[]): AccountWithBalance[] {
  return accounts.filter((a) => a.type === "bank" || a.type === "savings");
}
export function getCashWalletAccounts(accounts: AccountWithBalance[]): AccountWithBalance[] {
  return accounts.filter((a) => a.type === "cash" || a.type === "wallet");
}
export function getCreditCardAccounts(accounts: AccountWithBalance[]): AccountWithBalance[] {
  return accounts.filter((a) => a.type === "credit_card");
}

export interface NetPosition {
  assets: number;
  liabilities: number; // negative or zero
  net: number;
}

/**
 * Assets = everything that isn't a credit card (bank/savings/cash/wallet).
 * Liabilities = credit card balances, which are already negative (see
 * accountBalance — a card's balance goes negative as it's spent on, back
 * toward zero as it's paid off). Net = assets + liabilities.
 */
export function getNetPosition(accounts: AccountWithBalance[]): NetPosition {
  const assets = accounts
    .filter((a) => a.type !== "credit_card")
    .reduce((sum, a) => sum + a.current_balance, 0);
  const liabilities = accounts
    .filter((a) => a.type === "credit_card")
    .reduce((sum, a) => sum + Math.min(0, a.current_balance), 0);
  return { assets, liabilities, net: assets + liabilities };
}

/**
 * Net position as it stood as of a past date, by only counting transactions
 * up to that date. Used to compute the "vs last month" change on the
 * Accounts screen. Note: with the shipped sample data (clustered around
 * May–June 2026) compared against the real current date, this will often
 * come out as 0% simply because there's no sample activity in the actual
 * trailing 30 days — that's expected with static demo data, not a bug.
 */
export function getNetPositionAsOf(accounts: Account[], transactions: Transaction[], asOfDate: Date): NetPosition {
  const upToDate = transactions.filter((t) => new Date(t.date) <= asOfDate);
  const withBalances: AccountWithBalance[] = accounts.map((a) => ({
    ...a,
    current_balance: accountBalance(a, upToDate),
  }));
  return getNetPosition(withBalances);
}

export interface CreditCardUsage {
  outstanding: number; // positive amount currently owed
  available: number;
  percentUsed: number;
}

/** True if this account is an add-on card linked to a primary card. */
export function isAddonCard(account: Account): boolean {
  return !!account.parent_account_id;
}

/**
 * Every account that pools a single credit limit with `account` — the
 * primary card plus any add-on cards that have shares_credit_limit set.
 * Works whether you pass the primary itself or one of its add-ons.
 * Returns just [account] if it isn't part of a limit-sharing group.
 */
export function getCardGroup(
  account: AccountWithBalance,
  allAccounts: AccountWithBalance[]
): AccountWithBalance[] {
  const primaryId = account.parent_account_id ?? account.id;
  const primary = allAccounts.find((a) => a.id === primaryId);
  if (!primary) return [account];

  const sharedAddons = allAccounts.filter(
    (a) => a.parent_account_id === primaryId && a.shares_credit_limit
  );

  const accountIsInSharedGroup = account.id === primaryId || account.shares_credit_limit;
  if (sharedAddons.length === 0 || !accountIsInSharedGroup) return [account];

  return [primary, ...sharedAddons];
}

/**
 * Credit limit and outstanding balance for a card. Pass `allAccounts` to
 * correctly pool add-on cards that share a limit with their primary — the
 * limit comes from the primary card, and outstanding is summed across
 * every card in the group, so a primary and its add-ons always show the
 * same combined utilization. Without `allAccounts`, treats the account
 * standalone (its own credit_limit, its own balance only).
 */
export function getCreditCardUsage(
  account: AccountWithBalance,
  allAccounts?: AccountWithBalance[]
): CreditCardUsage {
  const primaryId = account.parent_account_id ?? account.id;
  const primary = allAccounts?.find((a) => a.id === primaryId) ?? account;
  const group = allAccounts ? getCardGroup(account, allAccounts) : [account];

  const limit = primary.credit_limit ?? account.credit_limit ?? 0;
  const outstanding = group.reduce((sum, a) => sum + Math.max(0, -a.current_balance), 0);
  const available = Math.max(0, limit - outstanding);
  const percentUsed = limit > 0 ? Math.round((outstanding / limit) * 100) : 0;
  return { outstanding, available, percentUsed };
}

/** "•••• 4821", or "" if there's nothing to mask. */
export function maskAccountNumber(lastFour?: string): string {
  return lastFour ? `•••• ${lastFour}` : "";
}

/** "•••• •••• •••• 4821" for credit cards (reads like a physical card), "•••• 4821" for everything else. */
export function formatCardNumber(lastFour?: string, accountType?: AccountType): string {
  if (!lastFour) return "";
  return accountType === "credit_card" ? `•••• •••• •••• ${lastFour}` : `•••• ${lastFour}`;
}

/**
 * The next calendar occurrence of a given day-of-month from `from` (default:
 * today). If that day has already passed this month, rolls to next month.
 * Used for credit card statement/due dates, which are recurring monthly
 * rather than a single fixed date.
 */
export function nextOccurrenceOfDay(day: number, from: Date = new Date()): Date {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const candidate = new Date(from.getFullYear(), from.getMonth(), day);
  if (candidate < today) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate;
}

export async function getTotalBalance(): Promise<number> {
  const accounts = await getAccountsWithBalances();
  return accounts.reduce((sum, a) => sum + a.current_balance, 0);
}

export interface PeriodRange {
  start: Date;
  end: Date;
}

/** Inclusive date range check, comparing by calendar day. */
export function inRange(dateStr: string, range: PeriodRange): boolean {
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
}

export function monthRange(year: number, month: number): PeriodRange {
  // month is 0-indexed
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

export function previousMonthRange(range: PeriodRange): PeriodRange {
  const start = new Date(range.start);
  start.setMonth(start.getMonth() - 1);
  const end = new Date(range.end);
  end.setMonth(end.getMonth() - 1);
  return { start, end };
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  remaining: number;
  percentIncomeRemaining: number;
}

export function summarizePeriod(transactions: Transaction[], range: PeriodRange): PeriodSummary {
  const inPeriod = transactions.filter((t) => inRange(t.date, range));
  const income = inPeriod
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenses = inPeriod
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const remaining = income - expenses;
  const percentIncomeRemaining = income > 0 ? Math.round((remaining / income) * 100) : 0;
  return { income, expenses, remaining, percentIncomeRemaining };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export interface CategoryBreakdownItem {
  category: Category;
  amount: number;
  percent: number;
}

export function categoryBreakdown(
  transactions: Transaction[],
  range: PeriodRange,
  allCategories: Category[],
  type: "expense" | "income" = "expense"
): CategoryBreakdownItem[] {
  const categories = allCategories.filter((c) => c.type === type);
  const inPeriod = transactions.filter((t) => t.type === type && inRange(t.date, range));
  const total = inPeriod.reduce((s, t) => s + t.amount, 0);

  const items = categories
    .map((category) => {
      const amount = inPeriod
        .filter((t) => t.category_id === category.id)
        .reduce((s, t) => s + t.amount, 0);
      const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
      return { category, amount, percent };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return items;
}

/** Daily income/expense series for a period, for the trend chart. */
export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
}

export function trendSeries(transactions: Transaction[], range: PeriodRange): TrendPoint[] {
  const days: TrendPoint[] = [];
  const cursor = new Date(range.start);
  while (cursor <= range.end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const dayTxns = transactions.filter((t) => t.date === dateStr);
    days.push({
      date: dateStr,
      income: dayTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: dayTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function formatCurrency(amount: number, currency = "INR"): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  });
  return formatter.format(amount);
}

export interface MonthOption {
  key: string; // "2026-05"
  year: number;
  month: number; // 0-indexed
  label: string; // "May 2026"
}

/** Distinct year-month combinations present in the transaction data, newest first. */
export function getAvailableMonths(transactions: Transaction[]): MonthOption[] {
  const seen = new Map<string, MonthOption>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    if (!seen.has(key)) {
      seen.set(key, {
        key,
        year,
        month,
        label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}
