import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  getAccountsWithBalances,
  getTransactions,
  getTotalBalance,
  monthRange,
  previousMonthRange,
  summarizePeriod,
  percentChange,
  categoryBreakdown,
  trendSeries,
} from "@/lib/finance";
import SummaryCard from "@/components/SummaryCard";
import TrendChart from "@/components/TrendChart";
import CategoryDonut from "@/components/CategoryDonut";
import TransactionRow from "@/components/TransactionRow";
import AccountCard from "@/components/AccountCard";
import Link from "next/link";

// Sample data is seeded around May 2026. Once real transactions flow in via
// Airtable, swap this for `new Date()` to always reflect the current month.
const REFERENCE_DATE = new Date("2026-05-31");

export default function DashboardPage() {
  const transactions = getTransactions();
  const accounts = getAccountsWithBalances();
  const totalBalance = getTotalBalance();

  const range = monthRange(REFERENCE_DATE.getFullYear(), REFERENCE_DATE.getMonth());
  const prevRange = previousMonthRange(range);

  const summary = summarizePeriod(transactions, range);
  const prevSummary = summarizePeriod(transactions, prevRange);

  const categories = categoryBreakdown(transactions, range, "expense");
  const trend = trendSeries(transactions, range);
  const recent = transactions.slice(0, 5);

  const monthLabel = REFERENCE_DATE.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-muted">Good morning, Arjun 👋</p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink">
          {monthLabel}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Total Balance"
          amount={totalBalance}
          icon={Wallet}
          changePercent={8}
        />
        <SummaryCard
          label="Income"
          amount={summary.income}
          icon={TrendingUp}
          tone="income"
          changePercent={percentChange(summary.income, prevSummary.income)}
        />
        <SummaryCard
          label="Expenses"
          amount={summary.expenses}
          icon={TrendingDown}
          tone="expense"
          changePercent={percentChange(summary.expenses, prevSummary.expenses)}
        />
        <SummaryCard
          label="Remaining"
          amount={summary.remaining}
          icon={PiggyBank}
          progress={{
            percent: summary.percentIncomeRemaining,
            label: `${summary.percentIncomeRemaining}% of income`,
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spending trend */}
        <div className="rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Spending Trend</h2>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-income" /> Income
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-expense" /> Expenses
              </span>
            </div>
          </div>
          <TrendChart data={trend} />
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">
            Spending by Category
          </h2>
          <CategoryDonut items={categories} total={summary.expenses} />
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              Recent Transactions
            </h2>
            <Link href="/transactions" className="text-xs font-medium text-brand">
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        </div>

        {/* Accounts summary */}
        <div className="rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">
              Accounts Summary
            </h2>
            <Link href="/accounts" className="text-xs font-medium text-brand">
              View All
            </Link>
          </div>
          <div className="divide-y divide-border">
            {accounts.map((a) => (
              <AccountCard key={a.id} account={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
