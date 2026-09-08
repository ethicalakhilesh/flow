import { notFound } from "next/navigation";
import { getTransactions, getAccounts, getCategories } from "@/lib/finance";
import TransactionDetailClient from "@/components/TransactionDetailClient";

// Always render on demand for any id - never statically prerendered.
export const dynamicParams = true;

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [transactions, accounts, categories] = await Promise.all([
    getTransactions(),
    getAccounts(),
    getCategories(),
  ]);

  const transaction = transactions.find((t) => t.id === params.id);
  if (!transaction) notFound();

  return <TransactionDetailClient transaction={transaction} categories={categories} accounts={accounts} />;
}
