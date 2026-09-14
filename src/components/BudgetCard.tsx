import Link from "next/link";
import type { BudgetWithStatus } from "@/lib/budget";
import { describeRecurrence, formatPeriodRange } from "@/lib/budget";
import { formatCurrency } from "@/lib/finance";
import CategoryIcon from "./CategoryIcon";

const STATUS_STYLE = {
  on_track: { bar: "bg-brand", text: "text-muted" },
  warning: { bar: "bg-warn", text: "text-warn" },
  over: { bar: "bg-expense", text: "text-expense" },
};

const STATUS_LABEL = {
  on_track: "On track",
  warning: "Near limit",
  over: "Over budget",
};

export default function BudgetCard({ item }: { item: BudgetWithStatus }) {
  const style = STATUS_STYLE[item.status];

  return (
    <Link href={`/budget/${item.budget.id}`} className="block px-1 py-4">
      <div className="mb-3 flex items-center gap-3">
        <CategoryIcon icon={item.category.icon} color={item.category.color} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{item.category.name}</div>
          <div className="truncate text-xs text-muted">
            {describeRecurrence(item.version.period_type, item.version.recurrence_day)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-base font-bold text-ink">
            {formatCurrency(item.spent)}{" "}
            <span className="text-sm font-normal text-muted">of {formatCurrency(item.version.amount)}</span>
          </div>
          <div className={`text-xs font-medium ${style.text}`}>{STATUS_LABEL[item.status]}</div>
        </div>
      </div>

      <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
        <div
          className={`h-full rounded-full ${style.bar}`}
          style={{ width: `${Math.min(100, item.percentUsed)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{formatPeriodRange(item.periodStart, item.periodEnd)}</span>
        <span>
          {item.remaining >= 0
            ? `${formatCurrency(item.remaining)} left`
            : `${formatCurrency(Math.abs(item.remaining))} over`}
        </span>
      </div>
    </Link>
  );
}
