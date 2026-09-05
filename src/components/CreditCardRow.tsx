import Link from "next/link";
import type { AccountWithBalance } from "@/lib/types";
import { formatCurrency, maskAccountNumber, getCreditCardUsage, nextOccurrenceOfDay } from "@/lib/finance";
import { getBankIconUrl, DEFAULT_BANK_ICON } from "@/lib/bankIcons";
import BrandLogo from "./BrandLogo";

export default function CreditCardRow({ account }: { account: AccountWithBalance }) {
  const iconUrl = getBankIconUrl(account.institution ?? account.name);
  const { outstanding, available, percentUsed } = getCreditCardUsage(account);

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
          <div className="text-xs text-muted">
            Credit Card
            {account.last_four && <> · {maskAccountNumber(account.last_four)}</>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-ink">{formatCurrency(outstanding)}</div>
          {account.credit_limit !== undefined && (
            <div className="text-xs text-muted">of {formatCurrency(account.credit_limit)}</div>
          )}
        </div>
      </div>

      {account.credit_limit !== undefined && (
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
          {account.credit_limit !== undefined && `Available: ${formatCurrency(available)}`}
        </span>
      </div>
      {dueLabel && <div className="mt-1 text-xs font-medium text-warn">{dueLabel}</div>}
    </Link>
  );
}
