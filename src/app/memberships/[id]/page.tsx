import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, IdCard, CalendarClock } from "lucide-react";
import {
  getProgramById,
  programBalance,
  getLoyaltyTransactions,
  getTransactionsForProgram,
  formatExpiry,
  formatPoints,
  isExpiringSoon,
} from "@/lib/loyalty";
import { getLoyaltyIconUrl, DEFAULT_LOYALTY_ICON_BY_CATEGORY } from "@/lib/loyaltyIcons";
import BrandLogo from "@/components/BrandLogo";
import LoyaltyTransactionRow from "@/components/LoyaltyTransactionRow";

export default function MembershipDetailPage({ params }: { params: { id: string } }) {
  const program = getProgramById(params.id);
  if (!program) notFound();

  const allTransactions = getLoyaltyTransactions();
  const balance = programBalance(program, allTransactions);
  const transactions = getTransactionsForProgram(program.id);

  const iconUrl = getLoyaltyIconUrl(program.brand, program.category);
  const expiryLabel = formatExpiry(program.expiry_date);
  const expiring = isExpiringSoon(program.expiry_date);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/memberships"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted"
      >
        <ChevronLeft size={16} />
        Memberships
      </Link>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <BrandLogo
          src={iconUrl}
          fallbackSrc={DEFAULT_LOYALTY_ICON_BY_CATEGORY[program.category]}
          size={48}
        />
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold text-ink">{program.brand}</h1>
          <p className="truncate text-sm text-muted">
            {program.program_name}
            {program.tier ? ` · ${program.tier}` : ""}
          </p>
        </div>
      </div>

      {/* Balance card */}
      <div className="mb-4 rounded-xl2 bg-brand p-5 text-white shadow-card">
        <div className="text-sm text-white/80">Current Balance</div>
        <div className="font-display text-3xl font-bold">
          {formatPoints(balance)} <span className="text-lg font-semibold">{program.points_name}</span>
        </div>
      </div>

      {/* Details */}
      <div className="mb-4 divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
        {program.member_id && (
          <div className="flex items-center gap-3 px-4 py-3">
            <IdCard size={16} className="shrink-0 text-muted" />
            <span className="text-sm text-muted">Member ID</span>
            <span className="ml-auto text-sm font-medium text-ink">{program.member_id}</span>
          </div>
        )}
        {expiryLabel && (
          <div className="flex items-center gap-3 px-4 py-3">
            <CalendarClock size={16} className="shrink-0 text-muted" />
            <span className="text-sm text-muted">Expires</span>
            <span
              className={`ml-auto text-sm font-medium ${expiring ? "text-warn" : "text-ink"}`}
            >
              {expiryLabel}
            </span>
          </div>
        )}
        {program.notes && (
          <div className="px-4 py-3">
            <span className="text-sm text-muted">{program.notes}</span>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="rounded-xl2 border border-border bg-surface p-2 shadow-card">
        <div className="px-2 pt-2 text-sm font-semibold text-ink">
          {program.points_name} History
        </div>
        {transactions.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">
            No {program.points_name.toLowerCase()} activity recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-border px-2">
            {transactions.map((t) => (
              <LoyaltyTransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
