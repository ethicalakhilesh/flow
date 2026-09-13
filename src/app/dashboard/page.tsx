import { headers } from "next/headers";
import { getAccountsWithBalances, getTransactions, getCategories, getTotalBalance } from "@/lib/finance";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const [transactions, accounts, categories, totalBalance] = await Promise.all([
    getTransactions(),
    getAccountsWithBalances(),
    getCategories(),
    getTotalBalance(),
  ]);

  // Set by middleware.ts after verifying the session cookie - first real
  // use of this forwarded header since it was added.
  const username = headers().get("x-flow-user-username") ?? undefined;

  return (
    <DashboardClient
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      totalBalance={totalBalance}
      username={username}
    />
  );
}
