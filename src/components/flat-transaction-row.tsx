import type { Transaction } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/dashboard-data";

export function FlatTransactionRow({ tx, isLast }: { tx: Transaction; isLast?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${isLast ? "" : "border-b border-border"}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <div>
          <p className="text-sm">{tx.merchant}</p>
          <p className="text-xs text-text-muted">{tx.date}</p>
        </div>
      </div>
      <span className={`text-sm font-medium ${tx.amount >= 0 ? "text-success" : "text-danger"}`}>
        {formatCurrency(tx.amount)}
      </span>
    </div>
  );
}
