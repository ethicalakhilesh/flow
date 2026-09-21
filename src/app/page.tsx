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
          <div className="rounded-card bg-surface-muted p-4">
            <p className="text-sm text-text-secondary">Own</p>
            <p className="mt-1 text-xl font-medium">{formatCurrency(data.own)}</p>
          </div>
          <div className="rounded-card bg-surface-muted p-4">
            <p className="text-sm text-text-secondary">Owe</p>
            <p className="mt-1 text-xl font-medium">{formatCurrency(data.owe)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="px-1 text-sm text-text-secondary">Recent transactions</span>
          {data.recentTransactions.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
