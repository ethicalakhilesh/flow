"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  getAvailableMonths,
  monthRange,
  previousMonthRange,
  summarizePeriod,
  percentChange,
  categoryBreakdown,
  trendSeries,
} from "@/lib/finance";
import type { AccountWithBalance, Category, Transaction } from "@/lib/types";
import SummaryCard from "@/components/SummaryCard";
import TrendChart from "@/components/TrendChart";
import CategoryDonut from "@/components/CategoryDonut";
import TransactionRow from "@/components/TransactionRow";
import AccountCard from "@/components/AccountCard";
import MonthSelector from "@/components/MonthSelector";
import ProfileMenu from "@/components/ProfileMenu";

export default function DashboardClient({
  transactions,
  accounts,
  categories,
  totalBalance,
  username,
}: {
  transactions: Transaction[];
  accounts: AccountWithBalance[];
  categories: Category[];
  totalBalance: number;
  username?: string;
}) {
  const months = useMemo(() => getAvailableMonths(transactions), [transactions]);

  const [selectedKey, setSelectedKey] = useState(months[0]?.key ?? "");
  const selectedMonth = months.find((m) => m.key === selectedKey) ?? months[0];

  const range = useMemo(
    () => (selectedMonth ? monthRange(selectedMonth.year, selectedMonth.month) : null),
    [selectedMonth]
  );
  const prevRange = useMemo(() => (range ? previousMonthRange(range) : null), [range]);

  const summary = range ? summarizePeriod(transactions, range) : null;
  const prevSummary = prevRange ? summarizePeriod(transactions, prevRange) : null;
  const categoryTotals = range ? categoryBreakdown(transactions, range, categories, "expense") : [];
  const trend = range ? trendSeries(transactions, range) : [];
  const recent = transactions.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <ProfileMenu username={username} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
            <p className="text-sm text-muted">
              {username ? `Good morning, ${username} 👋` : "Good morning 👋"}
            </p>
          </div>
        </div>
        <MonthSelector options={months} value={selectedKey} onChange={setSelectedKey} />
      </div>

      {!summary || !prevSummary ? (
        <p className="text-sm text-muted">No transaction data available yet.</p>
      ) : (
        <>
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
                <h2 className="font-display text-base font-semibold text-ink">
                  Spending Trend
                </h2>
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
              <CategoryDonut items={categoryTotals} total={summary.expenses} />
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
                  <TransactionRow key={t.id} transaction={t} categories={categories} accounts={accounts} />
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
        </>
      )}
    </div>
  );
}
