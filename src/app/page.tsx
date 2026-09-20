import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { AccountCard } from "@/components/account-card";
import { TransactionRow } from "@/components/transaction-row";
import { getDashboardData, formatCurrency } from "@/lib/dashboard-data";

export default async function Home() {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const data = await getDashboardData();

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Card>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Total balance</span>
            </div>
            <p className="text-3xl font-medium">{formatCurrency(data.totalBalance)}</p>
            <Pill className="self-start">
              {data.monthChangePct >= 0 ? "+" : ""}
              {data.monthChangePct}% this month
            </Pill>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {data.accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
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
