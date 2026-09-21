import Link from "next/link";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { TransactionRow } from "@/components/transaction-row";
import { getTransactions } from "@/lib/airtableData";

export default async function TransactionsList() {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const transactions = await getTransactions();
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-text-secondary">
            ← Back
          </Link>
          <Link href="/transactions/new" className="text-sm font-medium text-accent">
            + Add transaction
          </Link>
        </div>

        <h1 className="text-xl font-medium">All transactions</h1>

        <div className="flex flex-col gap-2">
          {sorted.map((tx) => (
            <Link key={tx.id} href={`/transactions/edit/${tx.id}`}>
              <TransactionRow
                tx={{
                  id: tx.id,
                  merchant: tx.merchant || "Unknown",
                  date: tx.date,
                  amount: tx.type === "expense" ? -tx.amount : tx.amount,
                }}
              />
            </Link>
          ))}
          {sorted.length === 0 && (
            <p className="px-1 text-sm text-text-muted">No transactions yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
