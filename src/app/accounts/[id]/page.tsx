import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  getAccountsWithBalances,
  getTransactions,
  getCreditCardUsage,
  maskAccountNumber,
  nextOccurrenceOfDay,
  formatCurrency,
} from "@/lib/finance";
import { getBankIconUrl, DEFAULT_BANK_ICON } from "@/lib/bankIcons";
import BrandLogo from "@/components/BrandLogo";
import TransactionRow from "@/components/TransactionRow";

// Always render on demand for any id - never statically prerendered.
export const dynamicParams = true;

const TYPE_LABEL = {
  bank: "Bank Account",
  savings: "Savings Account",
  cash: "Cash",
  wallet: "Digital Wallet",
  credit_card: "Credit Card",
};

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const accounts = getAccountsWithBalances();
  const account = accounts.find((a) => a.id === params.id);
  if (!account) notFound();

  const isCreditCard = account.type === "credit_card";
  const iconUrl = getBankIconUrl(account.institution ?? account.name);

  const allTransactions = getTransactions();
  const accountTransactions = allTransactions.filter((t) => t.account_id === account.id);
  const recent = accountTransactions.slice(0, 5);

  const usage = isCreditCard ? getCreditCardUsage(account) : null;
  const dueLabel =
    isCreditCard && account.due_day !== undefined
      ? nextOccurrenceOfDay(account.due_day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : null;
  const statementLabel =
    isCreditCard && account.statement_day !== undefined
      ? nextOccurrenceOfDay(account.statement_day).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : null;
  const openedLabel = account.opened_date
    ? new Date(account.opened_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/accounts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted"
      >
        <ChevronLeft size={16} />
        Accounts
      </Link>

      {/* Hero card */}
      <div className="mb-4 overflow-hidden rounded-xl2 bg-brand p-5 text-white shadow-card">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-[22%] bg-white/15 p-1">
            <BrandLogo src={iconUrl} fallbackSrc={DEFAULT_BANK_ICON} size={40} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold">{account.name}</div>
            <div className="truncate text-xs text-white/75">
              {account.account_subtype ?? TYPE_LABEL[account.type]}
              {account.last_four && <> · {maskAccountNumber(account.last_four)}</>}
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold">
          {formatCurrency(isCreditCard ? usage!.outstanding : account.current_balance)}
        </div>
        <div className="text-xs text-white/75">
          {isCreditCard ? "Outstanding Balance" : "Available Balance"}
        </div>
      </div>

      {/* Credit card usage */}
      {isCreditCard && usage && account.credit_limit !== undefined && (
        <div className="mb-4 rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{usage.percentUsed}% used</span>
            <span>Available: {formatCurrency(usage.available)}</span>
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="mb-4 grid grid-cols-2 gap-y-4 rounded-xl2 border border-border bg-surface p-4 shadow-card">
        <DetailField label="Account Type" value={account.account_subtype ?? TYPE_LABEL[account.type]} />
        {account.account_holder && <DetailField label="Account Holder" value={account.account_holder} />}

        {!isCreditCard && account.ifsc_code && <DetailField label="IFSC Code" value={account.ifsc_code} mono />}
        <DetailField label="Currency" value={account.currency} />

        {!isCreditCard && openedLabel && <DetailField label="Opened On" value={openedLabel} />}
        <DetailField
          label="Status"
          value={account.status === "active" ? "Active" : "Archived"}
          dot={account.status === "active" ? "#0E7C6B" : "#8A9694"}
        />

        {isCreditCard && account.credit_limit !== undefined && (
          <DetailField label="Credit Limit" value={formatCurrency(account.credit_limit)} />
        )}
        {isCreditCard && statementLabel && <DetailField label="Statement Date" value={statementLabel} />}
        {isCreditCard && dueLabel && <DetailField label="Payment Due" value={dueLabel} />}
        {isCreditCard && (
          <DetailField label="Payment Reminder" value={account.payment_reminder ? "On" : "Off"} />
        )}
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl2 border border-border bg-surface p-2 shadow-card">
        <div className="mb-1 flex items-center justify-between px-2 pt-2">
          <h2 className="text-sm font-semibold text-ink">Recent Transactions</h2>
          <Link href={`/transactions?account=${account.id}`} className="text-xs font-medium text-brand">
            View All
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">
            No transactions recorded for this account yet.
          </p>
        ) : (
          <div className="divide-y divide-border px-2">
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono = false,
  dot,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dot?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-0.5 flex items-center gap-1.5 text-sm font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}>
        {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />}
        {value}
      </div>
    </div>
  );
}
