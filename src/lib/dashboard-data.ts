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

// Placeholder until Airtable is wired back in (Phase 4 note in PLAN.md).
// Swap this function's body for a real Airtable fetch later — the shape
// above is what the UI components below expect.
export async function getDashboardData(): Promise<DashboardData> {
  return {
    totalBalance: 18240.5,
    monthChangePct: 2.4,
    accounts: [
      { id: "acc_checking", name: "Checking", balance: 6120.1, kind: "checking" },
      { id: "acc_credit", name: "Credit card", balance: -1340.0, kind: "credit" },
    ],
    recentTransactions: [
      { id: "tx_1", merchant: "Blue Bottle Coffee", date: "Today, 9:41 AM", amount: -6.5 },
      { id: "tx_2", merchant: "Whole Foods Market", date: "Yesterday, 6:12 PM", amount: -84.32 },
      { id: "tx_3", merchant: "Salary deposit", date: "Sep 18, 9:00 AM", amount: 4200.0 },
    ],
  };
}

export function formatCurrency(amount: number) {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
