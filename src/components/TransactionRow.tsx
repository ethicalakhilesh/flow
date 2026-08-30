import Link from "next/link";
import type { Transaction } from "@/lib/types";
import { formatCurrency, formatShortDate, getCategoryById, getAccounts } from "@/lib/finance";
import MerchantIcon from "./MerchantIcon";

export default function TransactionRow({ transaction }: { transaction: Transaction }) {
  const category = getCategoryById(transaction.category_id);
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";

  let subtitle = `${category?.name} · ${formatShortDate(transaction.date)}`;
  if (isTransfer && transaction.linked_account_id) {
    const linkedAccount = getAccounts().find((a) => a.id === transaction.linked_account_id);
    const arrow = transaction.transfer_direction === "out" ? "to" : "from";
    subtitle = `Transfer ${arrow} ${linkedAccount?.name ?? "linked account"} · ${formatShortDate(transaction.date)}`;
  }

  return (
    <Link
      href={`/transactions/${transaction.id}`}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-canvas"
    >
      <MerchantIcon merchant={transaction.merchant} category={category} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">
          {transaction.merchant || transaction.note || category?.name || "Transaction"}
        </div>
        <div className="truncate text-xs text-muted">{subtitle}</div>
      </div>
      <div
        className={`shrink-0 text-sm font-semibold ${
          isTransfer ? "text-ink" : isIncome ? "text-income" : "text-ink"
        }`}
      >
        {isTransfer ? (transaction.transfer_direction === "in" ? "+" : "−") : isIncome ? "+" : "−"}
        {formatCurrency(transaction.amount)}
      </div>
    </Link>
  );
}
