import { Wallet, PiggyBank } from "lucide-react";
import type { AccountWithBalance } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { getBankIconUrl, DEFAULT_BANK_ICON } from "@/lib/bankIcons";
import BrandLogo from "./BrandLogo";

const TYPE_LABEL = {
  bank: "Bank Account",
  savings: "Savings Account",
  cash: "Cash",
  wallet: "Wallet",
  credit_card: "Credit Card",
};

// Types tied to a real institution get a bank icon; cash/wallet don't have
// a bank behind them, so they keep a plain generic icon instead.
const BANK_LINKED_TYPES = new Set(["bank", "savings", "credit_card"]);

export default function AccountCard({ account }: { account: AccountWithBalance }) {
  const isLiability = account.type === "credit_card" && account.current_balance < 0;
  const showBankIcon = BANK_LINKED_TYPES.has(account.type);
  const iconUrl = showBankIcon ? getBankIconUrl(account.institution ?? account.name) : null;

  return (
    <div className="flex items-center gap-3 py-2.5">
      {iconUrl ? (
        <BrandLogo src={iconUrl} fallbackSrc={DEFAULT_BANK_ICON} size={36} />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[22%] bg-canvas text-muted">
          {account.type === "cash" || account.type === "wallet" ? (
            <Wallet size={17} strokeWidth={2.25} />
          ) : (
            <PiggyBank size={17} strokeWidth={2.25} />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{account.name}</div>
        <div className="text-xs text-muted">
          {account.institution ?? TYPE_LABEL[account.type]}
        </div>
      </div>
      <div
        className={`shrink-0 font-display text-base font-bold ${
          isLiability ? "text-expense" : "text-ink"
        }`}
      >
        {formatCurrency(account.current_balance)}
      </div>
    </div>
  );
}
