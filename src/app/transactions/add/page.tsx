import { getAccounts, getCategories } from "@/lib/finance";
import AddTransactionForm from "@/components/AddTransactionForm";

export default async function AddTransactionPage() {
  const [accounts, categories] = await Promise.all([getAccounts(), getCategories()]);
  return <AddTransactionForm accounts={accounts} categories={categories} />;
}
