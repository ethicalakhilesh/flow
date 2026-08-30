import accountsData from "@/data/accounts.json";
import transactionsData from "@/data/transactions.json";
import categoriesData from "@/data/categories.json";
import type {
  Account,
  AccountWithBalance,
  Category,
  Transaction,
} from "@/lib/types";

export function getAccounts(): Account[] {
  return accountsData as Account[];
}

export function getTransactions(): Transaction[] {
  return (transactionsData as Transaction[]).slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getCategories(): Category[] {
  return categoriesData as Category[];
}

export function getCategoryById(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
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

export function getAccountsWithBalances(): AccountWithBalance[] {
  const accounts = getAccounts();
  const transactions = getTransactions();
  return accounts.map((a) => ({
    ...a,
    current_balance: accountBalance(a, transactions),
  }));
}

export function getTotalBalance(): number {
  return getAccountsWithBalances().reduce((sum, a) => sum + a.current_balance, 0);
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
  type: "expense" | "income" = "expense"
): CategoryBreakdownItem[] {
  const categories = getCategories().filter((c) => c.type === type);
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
