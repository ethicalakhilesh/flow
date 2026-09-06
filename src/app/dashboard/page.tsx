import { getAccountsWithBalances, getTransactions, getCategories, getTotalBalance } from "@/lib/finance";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const [transactions, accounts, categories, totalBalance] = await Promise.all([
    getTransactions(),
    getAccountsWithBalances(),
    getCategories(),
    getTotalBalance(),
  ]);

  return (
    <DashboardClient
      transactions={transactions}
      accounts={accounts}
      categories={categories}
      totalBalance={totalBalance}
    />
  );
}
