import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CalendarClock } from "lucide-react";
import {
  getProgramById,
  programBalance,
  getLoyaltyTransactions,
  getTransactionsForProgram,
  formatExpiry,
  isExpiringSoon,
} from "@/lib/loyalty";
import MembershipCard from "@/components/MembershipCard";
import LoyaltyTransactionRow from "@/components/LoyaltyTransactionRow";

export default function MembershipDetailPage({ params }: { params: { id: string } }) {
  const program = getProgramById(params.id);
  if (!program) notFound();

  const allTransactions = getLoyaltyTransactions();
  const balance = programBalance(program, allTransactions);
  const transactions = getTransactionsForProgram(program.id);

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

      <MembershipCard program={{ ...program, points_balance: balance }} />

      {(expiryLabel || program.notes) && (
        <div className="mb-4 divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
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
      )}

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
