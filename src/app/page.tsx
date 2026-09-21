import Link from "next/link";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { TransactionRow } from "@/components/transaction-row";
import { getDashboardData, formatCurrency } from "@/lib/dashboard-data";

export default async function Home() {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const data = await getDashboardData();
  const netWorth = data.own - data.owe;

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-3">
            <span className="text-sm text-text-secondary">Net worth</span>
            <p className="text-3xl font-medium">{formatCurrency(netWorth)}</p>
            <Pill className="self-start">
              {data.monthChangePct >= 0 ? "+" : ""}
              {data.monthChangePct}% this month
            </Pill>
          </div>
        </Card>

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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-text-secondary">Recent transactions</span>
            <Link href="/transactions" className="text-sm font-medium text-accent">
              Show all
            </Link>
          </div>
          {data.recentTransactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
