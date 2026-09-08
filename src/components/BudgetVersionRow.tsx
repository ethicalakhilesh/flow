import type { BudgetVersion } from "@/lib/types";
import { describeRecurrence } from "@/lib/budget";
import { formatCurrency } from "@/lib/finance";

export default function BudgetVersionRow({
  version,
  isCurrent,
}: {
  version: BudgetVersion;
  isCurrent: boolean;
}) {
  const effectiveLabel = new Date(version.effective_from).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          {formatCurrency(version.amount)}
          {isCurrent && (
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
              Current
            </span>
          )}
        </div>
        <div className="text-xs text-muted">
          {describeRecurrence(version.period_type, version.recurrence_day)}
        </div>
      </div>
      <div className="shrink-0 text-right text-xs text-muted">
        Effective {effectiveLabel}
      </div>
    </div>
  );
}
