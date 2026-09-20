import type { Account } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/dashboard-data";

function AccountIcon({ kind }: { kind: Account["kind"] }) {
  const path =
    kind === "checking"
      ? "M3 10h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
      : "M2 8h20M6 16h4M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-solid)"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

export function AccountCard({ account }: { account: Account }) {
  return (
    <div className="rounded-card bg-surface-muted p-4">
      <AccountIcon kind={account.kind} />
      <p className="mt-2 text-sm text-text-secondary">{account.name}</p>
      <p className="mt-0.5 text-base font-medium">{formatCurrency(account.balance)}</p>
    </div>
  );
}
