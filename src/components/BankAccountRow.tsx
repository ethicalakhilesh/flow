import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { AccountWithBalance } from "@/lib/types";
import { formatCurrency, maskAccountNumber } from "@/lib/finance";
import { getBankIconUrl, DEFAULT_BANK_ICON } from "@/lib/bankIcons";
import BrandLogo from "./BrandLogo";

const ACCENT_COLORS = ["#0E7C6B", "#C7902F", "#3B7FC4", "#8B5FBF"];

export default function BankAccountRow({
  account,
  accentIndex = 0,
}: {
  account: AccountWithBalance;
  accentIndex?: number;
}) {
  const iconUrl = getBankIconUrl(account.institution ?? account.name);
  const accent = ACCENT_COLORS[accentIndex % ACCENT_COLORS.length];

  return (
    <Link
      href={`/accounts/${account.id}`}
      className="flex items-center gap-3 overflow-hidden rounded-xl2 border border-border bg-surface shadow-card"
    >
      <span className="h-full w-1 self-stretch" style={{ backgroundColor: accent }} />
      <div className="flex flex-1 items-center gap-3 py-3 pr-3">
        <BrandLogo src={iconUrl} fallbackSrc={DEFAULT_BANK_ICON} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{account.name}</div>
          <div className="truncate text-xs text-muted">
            {account.account_subtype ?? "Account"}
            {account.last_four && <> · {maskAccountNumber(account.last_four)}</>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-base font-bold text-ink">{formatCurrency(account.current_balance)}</div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-muted" />
      </div>
    </Link>
  );
}
