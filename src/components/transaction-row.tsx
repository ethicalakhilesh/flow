import type { Transaction } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/dashboard-data";

export function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div className="flex items-center justify-between rounded-card bg-surface-muted p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-bg text-accent-fg">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4.5 w-4.5"
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
      <span className="text-sm font-medium">{formatCurrency(tx.amount)}</span>
    </div>
  );
}
