import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Link2 } from "lucide-react";
import {
  getAccountsWithBalances,
  getTransactions,
  getCategories,
  getCreditCardUsage,
  nextOccurrenceOfDay,
  formatCurrency,
} from "@/lib/finance";
import AccountFaceCard from "@/components/AccountFaceCard";
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

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  const [accounts, allTransactions, categories] = await Promise.all([
    getAccountsWithBalances(),
    getTransactions(),
    getCategories(),
  ]);
  const account = accounts.find((a) => a.id === params.id);
  if (!account) notFound();

  const isCreditCard = account.type === "credit_card";
  const isAddon = !!account.parent_account_id;
  const primary = isAddon ? accounts.find((a) => a.id === account.parent_account_id) : undefined;
  const linkedAddons = accounts.filter(
    (a) => a.parent_account_id === account.id
  );

  const accountTransactions = allTransactions.filter((t) => t.account_id === account.id);
  const recent = accountTransactions.slice(0, 5);

  const usage = isCreditCard ? getCreditCardUsage(account, accounts) : null;
  // The limit that actually applies to this card — the primary's, if this
  // card pools its limit rather than having its own.
  const effectiveLimit = isAddon && account.shares_credit_limit ? primary?.credit_limit : account.credit_limit;

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

      {/* Account / card face */}
      <AccountFaceCard
        account={account}
        displayBalance={isCreditCard ? usage!.outstanding : undefined}
      />

      {/* Credit card usage */}
      {isCreditCard && usage && effectiveLimit !== undefined && (
        <div className="mb-4 rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{usage.percentUsed}% used{isAddon && account.shares_credit_limit ? " (shared limit)" : ""}</span>
            <span>Available: {formatCurrency(usage.available)}</span>
          </div>
        </div>
      )}

      {/* Add-on / primary card linkage */}
      {isCreditCard && (isAddon || linkedAddons.length > 0) && (
        <div className="mb-4 divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
          {isAddon && primary && (
            <Link href={`/accounts/${primary.id}`} className="flex items-center gap-3 px-4 py-3">
              <Link2 size={16} className="shrink-0 text-brand" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">Add-on of {primary.name}</div>
                <div className="text-xs text-muted">
                  {account.shares_credit_limit ? "Shares this card's credit limit" : "Has its own separate credit limit"}
                </div>
              </div>
            </Link>
          )}
          {linkedAddons.map((addon) => (
            <Link key={addon.id} href={`/accounts/${addon.id}`} className="flex items-center gap-3 px-4 py-3">
              <Link2 size={16} className="shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{addon.name}</div>
                <div className="text-xs text-muted">
                  {addon.shares_credit_limit ? "Add-on card · shares this limit" : "Add-on card · separate limit"}
                </div>
              </div>
            </Link>
          ))}
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

        {isCreditCard && effectiveLimit !== undefined && (
          <DetailField
            label="Credit Limit"
            value={`${formatCurrency(effectiveLimit)}${isAddon && account.shares_credit_limit ? " (shared)" : ""}`}
          />
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
              <TransactionRow key={t.id} transaction={t} categories={categories} accounts={accounts} />
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
