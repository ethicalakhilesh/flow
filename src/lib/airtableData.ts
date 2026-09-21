import { fetchAllRecords } from "@/lib/airtable";

export type AccountFields = {
  id: string;
  name: string;
  type: "bank" | "savings" | "cash" | "wallet" | "credit_card";
  institution?: string;
  initial_balance: number;
  currency?: string;
  status: "active" | "archived";
  account_subtype?: string;
  last_four?: string;
  is_primary?: boolean; // Airtable omits unchecked checkboxes — check `=== true`
  credit_limit?: number;
  parent_account_id?: string;
  shares_credit_limit?: boolean;
};

export type TransactionFields = {
  id: string;
  account_id: string;
  type: "income" | "expense" | "transfer";
  amount: number; // always positive; sign comes from `type`
  category_id?: string;
  merchant?: string;
  date: string;
  note?: string;
  transfer_id?: string;
  transfer_direction?: "out" | "in";
  linked_account_id?: string;
};

export async function getAccounts(): Promise<AccountFields[]> {
  const records = await fetchAllRecords<AccountFields>("accounts");
  return records.map((r) => r.fields).filter((a) => a.status === "active");
}

export async function getTransactions(): Promise<TransactionFields[]> {
  const records = await fetchAllRecords<TransactionFields>("transactions");
  return records.map((r) => r.fields);
}

// current_balance is always derived, never stored (per schema doc).
// Transfers are netted by direction; `is_primary`/credit-limit pooling
// across add-on cards is not implemented yet — out of scope for this pass.
export function currentBalance(account: AccountFields, transactions: TransactionFields[]) {
  let balance = account.initial_balance;
  for (const tx of transactions) {
    if (tx.account_id !== account.id) continue;
    if (tx.type === "income") balance += tx.amount;
    else if (tx.type === "expense") balance -= tx.amount;
    else if (tx.type === "transfer") balance += tx.transfer_direction === "in" ? tx.amount : -tx.amount;
  }
  return balance;
}
