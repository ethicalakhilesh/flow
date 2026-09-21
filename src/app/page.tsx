import Link from "next/link";
import { headers } from "next/headers";
import { DashboardHero } from "@/components/dashboard-hero";
import { FlatTransactionRow } from "@/components/flat-transaction-row";
import { getDashboardData, formatCurrency } from "@/lib/dashboard-data";

export default async function Home() {
  const username = headers().get("x-flow-user-username");

  if (!username) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <h1 className="text-3xl font-bold">Flow</h1>
        <p className="text-sm text-text-secondary">
          Track your accounts, transactions, and net worth in one place.
        </p>
        <Link
          href="/login"
          className="rounded-card bg-accent px-6 py-3 text-sm font-medium text-white"
        >
          Log in
        </Link>
      </main>
    );
  }

  const data = await getDashboardData();
  const netWorth = data.own - data.owe;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHero netWorth={formatCurrency(netWorth)} monthChangePct={data.monthChangePct} />

      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/accounts/own" className="rounded-card bg-surface-muted p-4">
            <p className="text-sm text-text-secondary">Own</p>
            <p className="mt-1 text-xl font-medium">{formatCurrency(data.own)}</p>
          </Link>
          <Link href="/accounts/owe" className="rounded-card bg-surface-muted p-4">
            <p className="text-sm text-text-secondary">Owe</p>
            <p className="mt-1 text-xl font-medium">{formatCurrency(data.owe)}</p>
          </Link>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-sm text-text-secondary">Recent transactions</span>
            <Link href="/transactions" className="text-sm font-medium text-accent">
              Show all
            </Link>
          </div>
          {data.recentTransactions.map((tx, i) => (
            <FlatTransactionRow
              key={tx.id}
              tx={tx}
              isLast={i === data.recentTransactions.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
