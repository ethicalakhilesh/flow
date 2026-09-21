import { getAccounts, getTransactions, currentBalance } from "@/lib/airtableData";

export type Account = {
  id: string;
  name: string;
  balance: number;
  kind: "checking" | "credit";
};

export type Transaction = {
  id: string;
  merchant: string;
  date: string;
  amount: number;
};

export type DashboardData = {
  totalBalance: number;
  monthChangePct: number;
  accounts: Account[];
  recentTransactions: Transaction[];
};

function toCardKind(type: string): Account["kind"] {
  return type === "credit_card" ? "credit" : "checking";
}

// Simplified: % change is this calendar month's net (income − expense)
// relative to total balance. Not a true trend line — good enough for the
// dashboard summary pill until real period-over-period logic is needed.
function monthChangePct(totalBalance: number, transactions: Awaited<ReturnType<typeof getTransactions>>) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let net = 0;
  for (const tx of transactions) {
    if (!tx.date?.startsWith(monthKey)) continue;
    if (tx.type === "income") net += tx.amount;
    else if (tx.type === "expense") net -= tx.amount;
  }
  if (totalBalance === 0) return 0;
  return Math.round((net / totalBalance) * 1000) / 10;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);

  const accountsWithBalance = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    balance: currentBalance(a, transactions),
    kind: toCardKind(a.type),
  }));

  const totalBalance = accountsWithBalance.reduce((sum, a) => sum + a.balance, 0);

  const recentTransactions = [...transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)
    .map((tx) => ({
      id: tx.id,
      merchant: tx.merchant || "Unknown",
      date: tx.date,
      amount: tx.type === "expense" ? -tx.amount : tx.amount,
    }));

  return {
    totalBalance,
    monthChangePct: monthChangePct(totalBalance, transactions),
    accounts: accountsWithBalance,
    recentTransactions,
  };
}

export function formatCurrency(amount: number) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
