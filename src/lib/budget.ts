import { fetchBudgets, fetchBudgetVersions } from "@/lib/airtableData";
import type { Budget, BudgetPeriodType, BudgetVersion, Category, Transaction } from "@/lib/types";

// The only two async functions here - call from a Server Component and
// pass results down; everything else is a pure function over already-
// fetched arrays, same pattern as finance.ts/loyalty.ts.

export async function getBudgets(): Promise<Budget[]> {
  return fetchBudgets();
}

export async function getBudgetVersions(): Promise<BudgetVersion[]> {
  return fetchBudgetVersions();
}

export function getVersionsForBudget(budgetId: string, versions: BudgetVersion[]): BudgetVersion[] {
  return versions
    .filter((v) => v.budget_id === budgetId)
    .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime());
}

/**
 * The version of a budget that's in effect as of a given date — the one
 * with the latest effective_from that isn't in the future. This is the
 * whole mechanism behind "amend a recurring budget without touching old
 * records": amending just adds a new row with a later effective_from,
 * so this function naturally returns the old version for past dates and
 * the new one from effective_from onward, with zero mutation of history.
 */
export function getActiveVersion(
  budgetId: string,
  versions: BudgetVersion[],
  asOfDate: Date
): BudgetVersion | null {
  const candidates = versions.filter(
    (v) => v.budget_id === budgetId && new Date(v.effective_from) <= asOfDate
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, v) =>
    new Date(v.effective_from) > new Date(latest.effective_from) ? v : latest
  );
}

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Most recent date <= `date` that falls on the given weekday (0=Sun..6=Sat). */
function previousOrSameWeekday(date: Date, weekday: number): Date {
  const d = atMidnight(date);
  const diff = (d.getDay() - weekday + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** Most recent date <= `date` that falls on the given day-of-month, clamping for short months. */
function previousOrSameMonthDay(date: Date, dayOfMonth: number): Date {
  const d = atMidnight(date);
  const clampedThisMonth = Math.min(dayOfMonth, daysInMonth(d.getFullYear(), d.getMonth()));
  const thisMonthOccurrence = new Date(d.getFullYear(), d.getMonth(), clampedThisMonth);
  if (thisMonthOccurrence <= d) return thisMonthOccurrence;

  const prevMonthDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const clampedPrevMonth = Math.min(dayOfMonth, daysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth()));
  return new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), clampedPrevMonth);
}

/** The next month's occurrence of a given day-of-month after `occurrence`, clamped for short months. */
function nextMonthOccurrence(occurrence: Date, dayOfMonth: number): Date {
  const next = new Date(occurrence.getFullYear(), occurrence.getMonth() + 1, 1);
  const clamped = Math.min(dayOfMonth, daysInMonth(next.getFullYear(), next.getMonth()));
  return new Date(next.getFullYear(), next.getMonth(), clamped);
}

export interface PeriodBounds {
  start: Date;
  end: Date;
}

/**
 * The start/end of the budget period containing `referenceDate`, given a
 * period type and its recurrence anchor:
 *   - "day": that single calendar day
 *   - "week": the 7-day window starting on the most recent occurrence of
 *     `recurrenceDay` (0=Sun..6=Sat) on/before referenceDate
 *   - "month": the window from the most recent occurrence of day-of-month
 *     `recurrenceDay` on/before referenceDate, up to the day before the
 *     next such occurrence (handles months with fewer days by clamping)
 */
export function getPeriodBounds(
  periodType: BudgetPeriodType,
  recurrenceDay: number | undefined,
  referenceDate: Date
): PeriodBounds {
  const ref = atMidnight(referenceDate);

  if (periodType === "day") {
    return { start: ref, end: ref };
  }

  if (periodType === "week") {
    const start = previousOrSameWeekday(ref, recurrenceDay ?? 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end };
  }

  // month
  const day = recurrenceDay ?? 1;
  const start = previousOrSameMonthDay(ref, day);
  const nextStart = nextMonthOccurrence(start, day);
  const end = new Date(nextStart);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

/** Sum of expense transactions for a category within [start, end], inclusive. */
export function getBudgetSpend(
  categoryId: string,
  transactions: Transaction[],
  start: Date,
  end: Date
): number {
  return transactions
    .filter((t) => t.type === "expense" && t.category_id === categoryId)
    .filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export type BudgetStatus = "on_track" | "warning" | "over";

/** Matches the original spec's thresholds: 0-79% on track, 80-99% warning, 100%+ over. */
export function getBudgetStatus(spent: number, amount: number): BudgetStatus {
  if (amount <= 0) return "on_track";
  const percent = (spent / amount) * 100;
  if (percent >= 100) return "over";
  if (percent >= 80) return "warning";
  return "on_track";
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

export function describeRecurrence(periodType: BudgetPeriodType, recurrenceDay?: number): string {
  if (periodType === "day") return "Resets every day";
  if (periodType === "week") return `Resets every ${WEEKDAY_NAMES[recurrenceDay ?? 0]}`;
  return `Resets on the ${ordinal(recurrenceDay ?? 1)} of each month`;
}

export function formatPeriodRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString("en-IN", { ...opts, year: "numeric" });
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-IN", opts);
  const endLabel = end.toLocaleDateString("en-IN", { ...opts, year: sameYear ? undefined : "numeric" });
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
}

export interface BudgetWithStatus {
  budget: Budget;
  version: BudgetVersion;
  category: Category;
  periodStart: Date;
  periodEnd: Date;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
}

/**
 * Pure orchestrator: pass in everything already fetched, get back a
 * display-ready list. Skips budgets that are inactive or don't have any
 * version effective yet as of referenceDate.
 */
export function getBudgetsWithStatus(
  budgets: Budget[],
  versions: BudgetVersion[],
  categories: Category[],
  transactions: Transaction[],
  referenceDate: Date = new Date()
): BudgetWithStatus[] {
  const result: BudgetWithStatus[] = [];

  for (const budget of budgets) {
    if (!budget.active) continue;
    const version = getActiveVersion(budget.id, versions, referenceDate);
    if (!version) continue;
    const category = categories.find((c) => c.id === budget.category_id);
    if (!category) continue;

    const { start, end } = getPeriodBounds(version.period_type, version.recurrence_day, referenceDate);
    const spent = getBudgetSpend(budget.category_id, transactions, start, end);
    const remaining = version.amount - spent;
    const percentUsed = version.amount > 0 ? Math.round((spent / version.amount) * 100) : 0;
    const status = getBudgetStatus(spent, version.amount);

    result.push({
      budget,
      version,
      category,
      periodStart: start,
      periodEnd: end,
      spent,
      remaining,
      percentUsed,
      status,
    });
  }

  return result;
}
