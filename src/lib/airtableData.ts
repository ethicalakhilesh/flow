import { fetchAllRecords, createRecords, updateRecords, deleteRecords, findRecordIdByAppId } from "@/lib/airtable";
import { nowIST } from "@/lib/ist-date";

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
  raw_data_merchant?: string;
  raw_data_category_id?: string;
  raw_data_note?: string;
  edited?: boolean; // Airtable omits unchecked checkboxes — check `=== true`
  transfer_id?: string;
  transfer_direction?: "out" | "in";
  linked_account_id?: string;
  linked_transaction_id?: string;
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
  to_account_id?: string; // transfers only — the destination account
};

export async function createTransaction(input: TransactionInput) {
  const amount = Math.abs(input.amount); // always positive; sign is a display concern only
  const createdAt = nowIST().toISOString(); // see comment below on the "Z" suffix

  if (input.type === "transfer") {
    if (!input.to_account_id) throw new Error("Transfer requires a destination account");
    const transferId = newId("trf");
    const outId = newId("txn");
    const inId = newId("txn");

    const outLeg: TransactionFields = {
      id: outId,
      account_id: input.account_id,
      type: "transfer",
      amount,
      category_id: input.category_id,
      merchant: input.merchant,
      date: input.date,
      note: input.note,
      created_at: createdAt,
      raw_data_merchant: input.merchant,
      raw_data_category_id: input.category_id,
      raw_data_note: input.note,
      transfer_id: transferId,
      transfer_direction: "out",
      linked_account_id: input.to_account_id,
      linked_transaction_id: inId,
    };
    const inLeg: TransactionFields = {
      ...outLeg,
      id: inId,
      account_id: input.to_account_id,
      transfer_direction: "in",
      linked_account_id: input.account_id,
      linked_transaction_id: outId,
    };
    await createRecords<TransactionFields>("transactions", [outLeg, inLeg]);
    return;
  }

  await createRecords<TransactionFields>("transactions", [
    {
      id: newId("txn"),
      account_id: input.account_id,
      type: input.type,
      amount,
      category_id: input.category_id,
      merchant: input.merchant,
      date: input.date,
      note: input.note,
      created_at: createdAt,
      // Immutable snapshot of what was entered at creation — never
      // rewritten by later edits (per schema doc).
      raw_data_merchant: input.merchant,
      raw_data_category_id: input.category_id,
      raw_data_note: input.note,
    } as TransactionFields,
  ]);
  // nowIST().toISOString() prints with a trailing "Z" but the clock digits
  // are IST wall-time, not UTC — intentional: created_at is kept as opaque
  // raw text for sub-day ordering, never parsed back as a real UTC instant.
}

export async function updateTransaction(appId: string, input: TransactionInput) {
  const existing = await getTransaction(appId);
  if (!existing) throw new Error(`Transaction ${appId} not found`);
  const recordId = await findRecordIdByAppId("transactions", appId);
  if (!recordId) throw new Error(`Transaction ${appId} not found`);

  const amount = Math.abs(input.amount);
  // edited flips true the first time merchant/category diverge from the
  // original raw_data snapshot — matches the old app's rule. Amount/date/
  // account changes don't affect this flag.
  const edited =
    existing.edited === true ||
    input.merchant !== existing.raw_data_merchant ||
    input.category_id !== existing.raw_data_category_id;

  const fields: Partial<TransactionFields> = {
    account_id: input.account_id,
    type: input.type,
    amount,
    category_id: input.category_id,
    merchant: input.merchant,
    date: input.date,
    note: input.note,
    edited,
  };

  await updateRecords<TransactionFields>("transactions", [{ id: recordId, fields }]);

  // Transfer legs must stay consistent — propagate shared fields (amount,
  // date, note, category) to the linked leg. account_id/direction/links
  // are per-leg and untouched.
  if (existing.transfer_id && existing.linked_transaction_id) {
    const linkedRecordId = await findRecordIdByAppId("transactions", existing.linked_transaction_id);
    if (linkedRecordId) {
      await updateRecords<TransactionFields>("transactions", [
        {
          id: linkedRecordId,
          fields: { amount, date: input.date, note: input.note, category_id: input.category_id },
        },
      ]);
    }
  }
}

export async function deleteTransaction(appId: string) {
  const existing = await getTransaction(appId);
  if (!existing) throw new Error(`Transaction ${appId} not found`);
  const recordId = await findRecordIdByAppId("transactions", appId);
  if (!recordId) throw new Error(`Transaction ${appId} not found`);

  // Delete both legs of a transfer together, never just one.
  if (existing.transfer_id && existing.linked_transaction_id) {
    const linkedRecordId = await findRecordIdByAppId("transactions", existing.linked_transaction_id);
    await deleteRecords("transactions", linkedRecordId ? [recordId, linkedRecordId] : [recordId]);
    return;
  }

  await deleteRecords("transactions", [recordId]);
}
