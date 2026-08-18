import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/finance";

export default function SummaryCard({
  label,
  amount,
  changePercent,
  changeLabel = "vs last month",
  icon: Icon,
  tone = "neutral",
  progress,
}: {
  label: string;
  amount: number;
  changePercent?: number;
  changeLabel?: string;
  icon: LucideIcon;
  tone?: "neutral" | "income" | "expense";
  progress?: { percent: number; label: string };
}) {
  const positive = (changePercent ?? 0) >= 0;
  const changeColor =
    tone === "expense"
      ? positive
        ? "text-expense"
        : "text-income"
      : positive
      ? "text-income"
      : "text-expense";

  return (
    <div className="rounded-xl2 border border-border bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas text-muted">
          <Icon size={16} strokeWidth={2.25} />
        </div>
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold text-ink">
        {formatCurrency(amount)}
      </div>
      {typeof changePercent === "number" && (
        <div className={`mt-1 text-xs font-medium ${changeColor}`}>
          {positive ? "↑" : "↓"} {Math.abs(changePercent)}% {changeLabel}
        </div>
      )}
      {progress && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted">{progress.label}</div>
        </div>
      )}
    </div>
  );
}
