import Link from "next/link";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { TransactionFormFields } from "@/components/transaction-form-fields";
import { getAccounts } from "@/lib/airtableData";
import { createTransactionAction } from "@/app/actions/transactions";

export default async function NewTransaction() {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const accounts = await getAccounts();

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Link href="/transactions" className="text-sm text-text-secondary">
          ← Cancel
        </Link>
        <h1 className="text-xl font-medium">Add transaction</h1>
        <form action={createTransactionAction} className="flex flex-col gap-4">
          <TransactionFormFields accounts={accounts} />
          <button
            type="submit"
            className="rounded-card bg-accent py-3 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
      </div>
    </AppShell>
  );
}
