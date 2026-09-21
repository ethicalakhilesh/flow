import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { getAccounts, getTransactions, currentBalance } from "@/lib/airtableData";
import { formatCurrency } from "@/lib/dashboard-data";

const OWE_TYPES = ["credit_card", "loan"];

export default async function AccountsList({ params }: { params: { filter: string } }) {
  if (params.filter !== "own" && params.filter !== "owe") notFound();

  const username = headers().get("x-flow-user-username") ?? "Guest";
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);

  const filtered = accounts.filter((a) =>
    params.filter === "owe" ? OWE_TYPES.includes(a.type) : !OWE_TYPES.includes(a.type)
  );

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-text-secondary">
            ← Back
          </Link>
          <Link href="/accounts/new" className="text-sm font-medium text-accent">
            + Add account
          </Link>
        </div>

        <h1 className="text-xl font-medium capitalize">{params.filter} accounts</h1>

        <div className="flex flex-col gap-2">
          {filtered.map((account) => {
            const balance = currentBalance(account, transactions);
            const owed = params.filter === "owe" ? Math.max(0, -balance) : balance;
            return (
              <Link
                key={account.id}
                href={`/accounts/edit/${account.id}`}
                className="flex items-center justify-between rounded-card bg-surface-muted p-4"
              >
                <div>
                  <p className="text-sm">{account.name}</p>
                  <p className="text-xs text-text-muted capitalize">{account.type.replace("_", " ")}</p>
                </div>
                <span className="text-sm font-medium">{formatCurrency(owed)}</span>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-1 text-sm text-text-muted">No accounts yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
