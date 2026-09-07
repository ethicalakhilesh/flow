import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import {
  getBudgets,
  getBudgetVersions,
  getVersionsForBudget,
  getActiveVersion,
  getPeriodBounds,
  getBudgetSpend,
  getBudgetStatus,
  describeRecurrence,
  formatPeriodRange,
} from "@/lib/budget";
import { getTransactions, getCategories, formatCurrency } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";
import BudgetVersionRow from "@/components/BudgetVersionRow";

// Always render on demand for any id - never statically prerendered.
export const dynamicParams = true;

const STATUS_STYLE = {
  on_track: { bar: "bg-brand", text: "text-muted" },
  warning: { bar: "bg-warn", text: "text-warn" },
  over: { bar: "bg-expense", text: "text-expense" },
};
const STATUS_LABEL = { on_track: "On track", warning: "Near limit", over: "Over budget" };

export default async function BudgetDetailPage({ params }: { params: { id: string } }) {
  const [budgets, allVersions, transactions, categories] = await Promise.all([
    getBudgets(),
    getBudgetVersions(),
    getTransactions(),
    getCategories(),
  ]);

  const budget = budgets.find((b) => b.id === params.id);
  if (!budget) notFound();

  const category = categories.find((c) => c.id === budget.category_id);
  const versions = getVersionsForBudget(budget.id, allVersions);
  const now = new Date();
  const currentVersion = getActiveVersion(budget.id, allVersions, now);

  const hasCurrentPeriod = !!currentVersion;
  const { start, end } = currentVersion
    ? getPeriodBounds(currentVersion.period_type, currentVersion.recurrence_day, now)
    : { start: now, end: now };
  const spent = currentVersion ? getBudgetSpend(budget.category_id, transactions, start, end) : 0;
  const status = currentVersion ? getBudgetStatus(spent, currentVersion.amount) : "on_track";
  const style = STATUS_STYLE[status];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link href="/budget" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft size={16} />
        Budget
      </Link>

      <div className="mb-4 flex items-center gap-3">
        {category && <CategoryIcon icon={category.icon} color={category.color} />}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold text-ink">
            {category?.name ?? "Budget"}
          </h1>
          {currentVersion && (
            <p className="text-sm text-muted">
              {describeRecurrence(currentVersion.period_type, currentVersion.recurrence_day)}
            </p>
          )}
        </div>
        <Link
          href={`/budget/${budget.id}/amend`}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink"
        >
          <Pencil size={13} />
          Amend
        </Link>
      </div>

      {hasCurrentPeriod && currentVersion ? (
        <div className="mb-4 rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-ink">{formatCurrency(spent)}</span>
            <span className="text-sm text-muted">of {formatCurrency(currentVersion.amount)}</span>
          </div>
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className={`h-full rounded-full ${style.bar}`}
              style={{ width: `${Math.min(100, currentVersion.amount > 0 ? Math.round((spent / currentVersion.amount) * 100) : 0)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{formatPeriodRange(start, end)}</span>
            <span className={`font-medium ${style.text}`}>{STATUS_LABEL[status]}</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 rounded-xl2 border border-border bg-surface p-4 text-center text-sm text-muted shadow-card">
          This budget doesn&apos;t take effect until a future date.
        </div>
      )}

      <div className="rounded-xl2 border border-border bg-surface p-2 shadow-card">
        <div className="px-2 pt-2 text-sm font-semibold text-ink">History</div>
        <p className="px-2 pb-2 text-xs text-muted">
          Amending this budget adds a new entry here rather than changing an old one — past
          periods keep using whatever amount was in effect at the time.
        </p>
        <div className="divide-y divide-border px-2">
          {versions.map((v) => (
            <BudgetVersionRow key={v.id} version={v} isCurrent={v.id === currentVersion?.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
