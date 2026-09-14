import type { LoyaltyTransaction } from "@/lib/types";
import { formatShortDate, formatPoints } from "@/lib/loyalty";

const TYPE_STYLE: Record<LoyaltyTransaction["type"], { label: string; sign: string; className: string }> = {
  earned: { label: "Earned", sign: "+", className: "text-income" },
  adjusted: { label: "Adjusted", sign: "+", className: "text-income" },
  redeemed: { label: "Redeemed", sign: "−", className: "text-ink" },
  expired: { label: "Expired", sign: "−", className: "text-expense" },
  transferred: { label: "Transferred", sign: "−", className: "text-ink" },
};

export default function LoyaltyTransactionRow({ transaction }: { transaction: LoyaltyTransaction }) {
  const style = TYPE_STYLE[transaction.type];

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {transaction.description || style.label}
        </div>
        <div className="text-xs text-muted">
          {style.label} · {formatShortDate(transaction.date)}
        </div>
      </div>
      <div className={`shrink-0 font-display text-base font-bold ${style.className}`}>
        {style.sign}
        {formatPoints(transaction.points)}
      </div>
    </div>
  );
}
