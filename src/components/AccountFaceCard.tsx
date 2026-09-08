import type { AccountWithBalance } from "@/lib/types";
import { formatCurrency, formatCardNumber } from "@/lib/finance";
import { getBankIconUrl, DEFAULT_BANK_ICON } from "@/lib/bankIcons";
import { buildCardGradient } from "@/lib/color";
import BrandLogo from "./BrandLogo";

const TYPE_LABEL = {
  bank: "Bank Account",
  savings: "Savings Account",
  cash: "Cash",
  wallet: "Digital Wallet",
  credit_card: "Credit Card",
};

/** Used only if an account has no card_color set in its data. */
const FALLBACK_CARD_COLOR = "#0E7C6B";

export default function AccountFaceCard({
  account,
  displayBalance,
  balanceLabel,
}: {
  account: AccountWithBalance;
  /** Override the shown amount — used for credit cards to show outstanding rather than raw balance. */
  displayBalance?: number;
  balanceLabel?: string;
}) {
  const iconUrl = getBankIconUrl(account.institution ?? account.name);
  const gradient = buildCardGradient(account.card_color ?? FALLBACK_CARD_COLOR);
  const cardNumber = formatCardNumber(account.last_four, account.type);

  return (
    <div
      className="relative mb-4 w-full overflow-hidden rounded-xl2 p-5 text-white shadow-card"
      style={{ aspectRatio: "1.586 / 1", background: gradient }}
    >
      {/* Decorative background ring, purely visual */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -top-2 h-28 w-28 rounded-full border border-white/10" />

      <div className="relative flex h-full flex-col justify-between">
        {/* Top row: logo + type badge */}
        <div className="flex items-start justify-between">
          <div className="rounded-[22%] bg-white/15 p-1">
            <BrandLogo src={iconUrl} fallbackSrc={DEFAULT_BANK_ICON} size={36} />
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
            {account.account_subtype ?? TYPE_LABEL[account.type]}
          </span>
        </div>

        {/* Name + institution */}
        <div>
          <div className="truncate font-display text-lg font-bold leading-tight">{account.name}</div>
          {account.institution && account.institution !== account.name && (
            <div className="truncate text-xs text-white/70">{account.institution}</div>
          )}
        </div>

        {/* Card number, embossed style */}
        {cardNumber && (
          <div className="font-mono text-sm tracking-[0.15em] text-white/90">{cardNumber}</div>
        )}

        {/* Balance */}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/60">
            {balanceLabel ?? (account.type === "credit_card" ? "Outstanding Balance" : "Available Balance")}
          </div>
          <div className="font-display text-xl font-bold">
            {formatCurrency(displayBalance ?? account.current_balance)}
          </div>
        </div>
      </div>
    </div>
  );
}
