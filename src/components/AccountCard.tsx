import { Landmark, Wallet, CreditCard, PiggyBank } from "lucide-react";
import type { AccountWithBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";

const TYPE_ICON = {
  bank: Landmark,
  savings: PiggyBank,
  cash: Wallet,
  wallet: Wallet,
  credit_card: CreditCard,
};

const TYPE_LABEL = {
  bank: "Bank Account",
  savings: "Savings Account",
  cash: "Cash",
  wallet: "Wallet",
  credit_card: "Credit Card",
};

export default function AccountCard({ account }: { account: AccountWithBalance }) {
  const Icon = TYPE_ICON[account.type];
  const isLiability = account.type === "credit_card" && account.current_balance < 0;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
        <Icon size={17} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{account.name}</div>
        <div className="text-xs text-muted">
          {account.institution ?? TYPE_LABEL[account.type]}
        </div>
      </div>
      <div
        className={`shrink-0 text-sm font-semibold ${
          isLiability ? "text-expense" : "text-ink"
        }`}
      >
        {formatCurrency(account.current_balance)}
      </div>
    </div>
  );
}
