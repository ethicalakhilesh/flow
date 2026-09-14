import Link from "next/link";
import { Link2 } from "lucide-react";
import type { AccountWithBalance } from "@/lib/types";
import { formatCurrency, maskAccountNumber, getCreditCardUsage, nextOccurrenceOfDay } from "@/lib/finance";
import { getBankIconUrl, DEFAULT_BANK_ICON } from "@/lib/bankIcons";
import BrandLogo from "./BrandLogo";

export default function CreditCardRow({
  account,
  allAccounts,
}: {
  account: AccountWithBalance;
  /** Pass the full account list so add-on cards correctly pool their limit with the primary. */
  allAccounts?: AccountWithBalance[];
}) {
  const iconUrl = getBankIconUrl(account.institution ?? account.name);
  const { outstanding, available, percentUsed } = getCreditCardUsage(account, allAccounts);

  const isAddon = !!account.parent_account_id;
  const primary = isAddon ? allAccounts?.find((a) => a.id === account.parent_account_id) : undefined;
  const addonCount = allAccounts?.filter(
    (a) => a.parent_account_id === account.id && a.shares_credit_limit
  ).length ?? 0;

  // The effective limit is the primary's when this card shares one — same
  // logic getCreditCardUsage uses, just needed here to decide whether to
  // render the limit-dependent bits ("of ₹X", the progress bar) at all.
  const effectiveLimit =
    (isAddon ? primary?.credit_limit : account.credit_limit) ?? account.credit_limit;

  const dueLabel =
    account.due_day !== undefined
      ? `Due on ${nextOccurrenceOfDay(account.due_day).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
      : null;

  return (
    <Link
      href={`/accounts/${account.id}`}
      className="block overflow-hidden rounded-xl2 border border-ink bg-surface p-4 shadow-card"
    >
      <div className="mb-3 flex items-start gap-3">
        <BrandLogo src={iconUrl} fallbackSrc={DEFAULT_BANK_ICON} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{account.name}</div>
          <div className="truncate text-xs text-muted">
            Credit Card
            {account.last_four && <> · {maskAccountNumber(account.last_four)}</>}
          </div>
          {isAddon && primary && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-brand">
              <Link2 size={11} />
              Add-on of {primary.name}
              {account.shares_credit_limit && " · shares limit"}
            </div>
          )}
          {!isAddon && addonCount > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-muted">
              <Link2 size={11} />
              {addonCount} add-on {addonCount === 1 ? "card" : "cards"} sharing this limit
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-base font-bold text-ink">{formatCurrency(outstanding)}</div>
          {effectiveLimit !== undefined && (
            <div className="text-xs text-muted">of {formatCurrency(effectiveLimit)}</div>
          )}
        </div>
      </div>

      {effectiveLimit !== undefined && (
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{percentUsed}% used</span>
        <span className="text-muted">
          {effectiveLimit !== undefined && `Available: ${formatCurrency(available)}`}
        </span>
      </div>
      {dueLabel && <div className="mt-1 text-xs font-medium text-warn">{dueLabel}</div>}
    </Link>
  );
}
