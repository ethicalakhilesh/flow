import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getAccountsWithBalances,
  getBankAccounts,
  getCashWalletAccounts,
  getCreditCardAccounts,
  getNetPosition,
  getNetPositionAsOf,
  getTransactions,
  percentChange,
} from "@/lib/finance";
import NetPositionCard from "@/components/NetPositionCard";
import BankAccountRow from "@/components/BankAccountRow";
import CreditCardRow from "@/components/CreditCardRow";

export default function AccountsPage() {
  const accounts = getAccountsWithBalances();
  const transactions = getTransactions();

  const bankAccounts = [...getBankAccounts(accounts), ...getCashWalletAccounts(accounts)];
  const creditCards = getCreditCardAccounts(accounts);

  const netPosition = getNetPosition(accounts);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const previousNet = getNetPositionAsOf(accounts, transactions, thirtyDaysAgo);
  const changePercent = percentChange(netPosition.net, previousNet.net);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Accounts</h1>
          <p className="text-sm text-muted">All your accounts in one place</p>
        </div>
      </div>

      <NetPositionCard position={netPosition} changePercent={changePercent} />

      {bankAccounts.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 px-1">
            <h2 className="text-sm font-semibold text-ink">Bank Accounts</h2>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
              {bankAccounts.length}
            </span>
          </div>
          <div className="space-y-2">
            {bankAccounts.map((a, i) => (
              <BankAccountRow key={a.id} account={a} accentIndex={i} />
            ))}
          </div>
        </div>
      )}

      {creditCards.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 px-1">
            <h2 className="text-sm font-semibold text-ink">Credit Cards</h2>
            <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
              {creditCards.length}
            </span>
          </div>
          <div className="space-y-2">
            {creditCards.map((a) => (
              <CreditCardRow key={a.id} account={a} allAccounts={accounts} />
            ))}
          </div>
        </div>
      )}

      <Link
        href="/accounts/add"
        className="flex items-center justify-center gap-2 rounded-xl2 border border-dashed border-brand bg-brand-light py-3 text-sm font-semibold text-brand-dark"
      >
        <Plus size={17} />
        Add Account
      </Link>
    </div>
  );
}
