import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { TransactionFormFields } from "@/components/transaction-form-fields";
import { getTransaction, getAccounts, getCategories } from "@/lib/airtableData";
import { updateTransactionAction, deleteTransactionAction } from "@/app/actions/transactions";

export default async function EditTransaction({ params }: { params: { id: string } }) {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const [transaction, accounts, categories] = await Promise.all([
    getTransaction(params.id),
    getAccounts(),
    getCategories(),
  ]);
  if (!transaction) notFound();

  const updateWithId = updateTransactionAction.bind(null, transaction.id);
  const deleteWithId = deleteTransactionAction.bind(null, transaction.id);

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Link href="/transactions" className="text-sm text-text-secondary">
          ← Cancel
        </Link>
        <h1 className="text-xl font-medium">Edit transaction</h1>
        <form action={updateWithId} className="flex flex-col gap-4">
          <TransactionFormFields defaults={transaction} accounts={accounts} categories={categories} />
          <button
            type="submit"
            className="rounded-card bg-accent py-3 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="w-full rounded-card border border-border py-3 text-sm font-medium text-text-secondary"
          >
            Delete transaction
          </button>
        </form>
      </div>
    </AppShell>
  );
}
