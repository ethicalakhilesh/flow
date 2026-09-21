import { fetchAllRecords, createRecords, updateRecords, deleteRecords, findRecordIdByAppId } from "@/lib/airtable";

export type AccountFields = {
  id: string;
  name: string;
  type: "bank" | "savings" | "cash" | "wallet" | "credit_card" | "investment" | "loan";
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
  created_at?: string;
  transfer_id?: string;
  transfer_direction?: "out" | "in";
  linked_account_id?: string;
};

export type CategoryFields = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  icon?: string;
  color?: string;
};

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Read-only — no write route for categories yet (seeded directly in
// Airtable per the schema doc).
export async function getCategories(): Promise<CategoryFields[]> {
  const records = await fetchAllRecords<CategoryFields>("categories");
  return records.map((r) => r.fields);
}

export async function getAccounts(): Promise<AccountFields[]> {
  const records = await fetchAllRecords<AccountFields>("accounts");
  return records.map((r) => r.fields).filter((a) => a.status === "active");
}

export async function getAccount(id: string): Promise<AccountFields | null> {
  const all = await fetchAllRecords<AccountFields>("accounts");
  return all.map((r) => r.fields).find((a) => a.id === id) ?? null;
}

export async function getTransactions(): Promise<TransactionFields[]> {
  const records = await fetchAllRecords<TransactionFields>("transactions");
  return records.map((r) => r.fields);
}

export async function getTransaction(id: string): Promise<TransactionFields | null> {
  const all = await fetchAllRecords<TransactionFields>("transactions");
  return all.map((r) => r.fields).find((t) => t.id === id) ?? null;
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

// ── Accounts CRUD ───────────────────────────────────────────────

export async function createAccount(input: {
  name: string;
  type: AccountFields["type"];
  initial_balance: number;
}) {
  await createRecords<AccountFields>("accounts", [
    {
      id: newId("acc"),
      name: input.name,
      type: input.type,
      initial_balance: input.initial_balance,
      status: "active",
    } as AccountFields,
  ]);
}

export async function updateAccount(
  appId: string,
  input: { name: string; type: AccountFields["type"]; initial_balance: number }
) {
  const recordId = await findRecordIdByAppId("accounts", appId);
  if (!recordId) throw new Error(`Account ${appId} not found`);
  await updateRecords<AccountFields>("accounts", [{ id: recordId, fields: input }]);
}

export async function archiveAccount(appId: string) {
  const recordId = await findRecordIdByAppId("accounts", appId);
  if (!recordId) throw new Error(`Account ${appId} not found`);
  await updateRecords<AccountFields>("accounts", [{ id: recordId, fields: { status: "archived" } }]);
}

// ── Transactions CRUD ───────────────────────────────────────────

export type TransactionInput = {
  account_id: string;
  type: TransactionFields["type"];
  amount: number;
  category_id?: string;
  merchant?: string;
  date: string;
  note?: string;
};

export async function createTransaction(input: TransactionInput) {
  await createRecords<TransactionFields>("transactions", [
    { id: newId("txn"), created_at: new Date().toISOString(), ...input } as TransactionFields,
  ]);
}

export async function updateTransaction(appId: string, input: TransactionInput) {
  const recordId = await findRecordIdByAppId("transactions", appId);
  if (!recordId) throw new Error(`Transaction ${appId} not found`);
  await updateRecords<TransactionFields>("transactions", [{ id: recordId, fields: input }]);
}

export async function deleteTransaction(appId: string) {
  const recordId = await findRecordIdByAppId("transactions", appId);
  if (!recordId) throw new Error(`Transaction ${appId} not found`);
  await deleteRecords("transactions", [recordId]);
}
