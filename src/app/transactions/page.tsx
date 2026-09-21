import Link from "next/link";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { TransactionRow } from "@/components/transaction-row";
import { getTransactions } from "@/lib/airtableData";

const PAGE_SIZE = 20;

export default async function TransactionsList({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const transactions = await getTransactions();
  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(searchParams.page) || 1), totalPages);
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          {pageItems.map((tx) => (
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
          {pageItems.length === 0 && (
            <p className="px-1 text-sm text-text-muted">No transactions yet.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/transactions?page=${page - 1}`}
              aria-disabled={page <= 1}
              className={`text-sm font-medium ${page <= 1 ? "pointer-events-none text-text-muted" : "text-accent"}`}
            >
              ← Prev
            </Link>
            <span className="text-sm text-text-secondary">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/transactions?page=${page + 1}`}
              aria-disabled={page >= totalPages}
              className={`text-sm font-medium ${page >= totalPages ? "pointer-events-none text-text-muted" : "text-accent"}`}
            >
              Next →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
