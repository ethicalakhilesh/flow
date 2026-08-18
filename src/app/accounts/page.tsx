import { Plus } from "lucide-react";
import { getAccountsWithBalances, getTotalBalance, formatCurrency } from "@/lib/finance";
import AccountCard from "@/components/AccountCard";

export default function AccountsPage() {
  const accounts = getAccountsWithBalances();
  const total = getTotalBalance();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Accounts</h1>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
          <Plus size={18} />
        </button>
      </div>

      <div className="mb-4 rounded-xl2 bg-brand p-5 text-white shadow-card">
        <div className="text-sm text-white/80">Total Balance</div>
        <div className="font-display text-3xl font-bold">{formatCurrency(total)}</div>
      </div>

      <div className="rounded-xl2 border border-border bg-surface p-2 shadow-card">
        <div className="px-2 pt-2 text-sm font-semibold text-ink">My Accounts</div>
        <div className="divide-y divide-border px-2">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a} />
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Balances are calculated automatically: initial balance + income − expenses
        recorded against each account.
      </p>
    </div>
  );
}
