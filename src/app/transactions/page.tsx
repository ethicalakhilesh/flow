import { getTransactions, getAccounts, getCategories } from "@/lib/finance";
import TransactionsClient from "@/components/TransactionsClient";

export default async function TransactionsPage() {
  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
  ]);

  return <TransactionsClient transactions={transactions} accounts={accounts} categories={categories} />;
}
