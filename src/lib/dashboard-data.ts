import { getAccounts, getTransactions, currentBalance, type AccountFields } from "@/lib/airtableData";

export type Transaction = {
  id: string;
  merchant: string;
  date: string;
  amount: number;
};

export type DashboardData = {
  own: number;
  owe: number;
  monthChangePct: number;
  recentTransactions: Transaction[];
};

const OWE_TYPES: AccountFields["type"][] = ["credit_card", "loan"];

// Simplified: % change is this calendar month's net (income − expense)
// relative to net worth (own − owe). Not a true trend line — good enough
// for the dashboard summary pill until real period-over-period logic is
// needed.
function monthChangePct(netWorth: number, transactions: Awaited<ReturnType<typeof getTransactions>>) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  let net = 0;
  for (const tx of transactions) {
    if (!tx.date?.startsWith(monthKey)) continue;
    if (tx.type === "income") net += tx.amount;
    else if (tx.type === "expense") net -= tx.amount;
  }
  if (netWorth === 0) return 0;
  return Math.round((net / netWorth) * 1000) / 10;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);

  let own = 0;
  let owe = 0;

  for (const account of accounts) {
    const balance = currentBalance(account, transactions);
    if (OWE_TYPES.includes(account.type)) {
      // Outstanding balance owed — stored/derived as negative for credit
      // cards, so flip sign to report a positive "owed" amount.
      owe += Math.max(0, -balance);
    } else {
      own += balance;
    }
  }

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
    own,
    owe,
    monthChangePct: monthChangePct(own - owe, transactions),
    recentTransactions,
  };
}

export function formatCurrency(amount: number) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
