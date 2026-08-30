import type { Transaction } from "@/lib/types";
import { formatCurrency, formatShortDate, getCategoryById } from "@/lib/finance";
import MerchantIcon from "./MerchantIcon";

export default function TransactionRow({ transaction }: { transaction: Transaction }) {
  const category = getCategoryById(transaction.category_id);
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center gap-3 py-2.5">
      <MerchantIcon merchant={transaction.merchant} category={category} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {transaction.merchant || transaction.note || category?.name || "Transaction"}
        </div>
        <div className="text-xs text-muted">
          {category?.name} · {formatShortDate(transaction.date)}
        </div>
      </div>
      <div
        className={`shrink-0 text-sm font-semibold ${
          isIncome ? "text-income" : "text-ink"
        }`}
      >
        {isIncome ? "+" : "−"}
        {formatCurrency(transaction.amount)}
      </div>
    </div>
  );
}
