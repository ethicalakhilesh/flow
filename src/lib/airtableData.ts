import { fetchAllRecords, fetchRecord, createRecord, createRecords, updateRecord, updateRecords, findRecordIdByAppId } from "@/lib/airtable";
import type {
  Account,
  AccountType,
  Category,
  LoyaltyCategory,
  LoyaltyProgram,
  LoyaltyTransaction,
  LoyaltyTransactionType,
  Transaction,
  TransactionType,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Raw Airtable field shapes, one per table. Field names here must exactly
// match the column names in Airtable (case-sensitive). Every field is
// optional because Airtable omits empty fields from the response entirely
// rather than sending null/"" — there's no way to tell "empty" from
// "column doesn't exist" from the API's shape alone.
// ---------------------------------------------------------------------------

interface AirtableAccountFields {
  id?: string;
  name?: string;
  type?: AccountType;
  institution?: string;
  initial_balance?: number;
  currency?: string;
  status?: "active" | "archived";
  account_subtype?: string;
  last_four?: string;
  is_primary?: boolean;
  ifsc_code?: string;
  account_holder?: string;
  opened_date?: string;
  card_color?: string;
  credit_limit?: number;
  statement_day?: number;
  due_day?: number;
  payment_reminder?: boolean;
  parent_account_id?: string;
  shares_credit_limit?: boolean;
}

interface AirtableTransactionFields {
  id?: string;
  account_id?: string;
  type?: TransactionType;
  amount?: number;
  category_id?: string;
  merchant?: string;
  date?: string;
  note?: string;
  created_at?: string;
  raw_data_merchant?: string;
  raw_data_category_id?: string;
  raw_data_note?: string;
  raw_data_source_text?: string;
  edited?: boolean;
  transfer_id?: string;
  transfer_direction?: "out" | "in";
  linked_account_id?: string;
  linked_transaction_id?: string;
}

interface AirtableCategoryFields {
  id?: string;
  name?: string;
  type?: "income" | "expense" | "transfer";
  icon?: string;
  color?: string;
}

interface AirtableLoyaltyProgramFields {
  id?: string;
  brand?: string;
  program_name?: string;
  points_name?: string;
  category?: LoyaltyCategory;
  member_id?: string;
  starting_balance?: number;
  tier?: string;
  expiry_date?: string;
  notes?: string;
  card_color?: string;
}

interface AirtableLoyaltyTransactionFields {
  id?: string;
  program_id?: string;
  type?: LoyaltyTransactionType;
  points?: number;
  date?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Mappers: Airtable record -> app type. Checkbox fields need `=== true`
// rather than truthy checks, since Airtable omits false checkboxes rather
// than sending `false`.
// ---------------------------------------------------------------------------

function mapAccount(f: AirtableAccountFields): Account {
  return {
    id: f.id ?? "",
    name: f.name ?? "",
    type: f.type ?? "bank",
    institution: f.institution,
    initial_balance: f.initial_balance ?? 0,
    currency: f.currency ?? "INR",
    status: f.status ?? "active",
    account_subtype: f.account_subtype,
    last_four: f.last_four,
    is_primary: f.is_primary === true,
    ifsc_code: f.ifsc_code,
    account_holder: f.account_holder,
    opened_date: f.opened_date,
    card_color: f.card_color,
    credit_limit: f.credit_limit,
    statement_day: f.statement_day,
    due_day: f.due_day,
    payment_reminder: f.payment_reminder === true,
    parent_account_id: f.parent_account_id,
    shares_credit_limit: f.shares_credit_limit === true,
  };
}

function mapTransaction(f: AirtableTransactionFields): Transaction {
  const hasRawData = f.raw_data_merchant || f.raw_data_category_id || f.raw_data_note || f.raw_data_source_text;
  return {
    id: f.id ?? "",
    account_id: f.account_id ?? "",
    type: f.type ?? "expense",
    amount: f.amount ?? 0,
    category_id: f.category_id ?? "",
    merchant: f.merchant,
    date: f.date ?? "",
    note: f.note,
    created_at: f.created_at ?? "",
    raw_data: hasRawData
      ? {
          merchant: f.raw_data_merchant,
          category_id: f.raw_data_category_id,
          note: f.raw_data_note,
          source_text: f.raw_data_source_text,
        }
      : undefined,
    edited: f.edited === true,
    transfer_id: f.transfer_id,
    transfer_direction: f.transfer_direction,
    linked_account_id: f.linked_account_id,
    linked_transaction_id: f.linked_transaction_id,
  };
}

function mapCategory(f: AirtableCategoryFields): Category {
  return {
    id: f.id ?? "",
    name: f.name ?? "",
    type: f.type ?? "expense",
    icon: f.icon ?? "dots",
    color: f.color ?? "#8A9694",
  };
}

function mapLoyaltyProgram(f: AirtableLoyaltyProgramFields): LoyaltyProgram {
  return {
    id: f.id ?? "",
    brand: f.brand ?? "",
    program_name: f.program_name ?? "",
    points_name: f.points_name ?? "points",
    category: f.category ?? "other",
    member_id: f.member_id,
    starting_balance: f.starting_balance ?? 0,
    tier: f.tier,
    expiry_date: f.expiry_date,
    notes: f.notes,
    card_color: f.card_color,
  };
}

function mapLoyaltyTransaction(f: AirtableLoyaltyTransactionFields): LoyaltyTransaction {
  return {
    id: f.id ?? "",
    program_id: f.program_id ?? "",
    type: f.type ?? "earned",
    points: f.points ?? 0,
    date: f.date ?? "",
    description: f.description,
  };
}

// ---------------------------------------------------------------------------
// Public fetchers - one per table. Table names must match Airtable exactly.
// ---------------------------------------------------------------------------

export async function fetchAccounts(): Promise<Account[]> {
  const records = await fetchAllRecords<AirtableAccountFields>("accounts");
  return records.map((r) => mapAccount(r.fields));
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const records = await fetchAllRecords<AirtableTransactionFields>("transactions");
  return records.map((r) => mapTransaction(r.fields));
}

export async function fetchCategories(): Promise<Category[]> {
  const records = await fetchAllRecords<AirtableCategoryFields>("categories");
  return records.map((r) => mapCategory(r.fields));
}

export async function fetchLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
  const records = await fetchAllRecords<AirtableLoyaltyProgramFields>("loyalty_programs");
  return records.map((r) => mapLoyaltyProgram(r.fields));
}

export async function fetchLoyaltyTransactions(): Promise<LoyaltyTransaction[]> {
  const records = await fetchAllRecords<AirtableLoyaltyTransactionFields>("loyalty_transactions");
  return records.map((r) => mapLoyaltyTransaction(r.fields));
}

// ---------------------------------------------------------------------------
// Single-record fetchers, by Airtable's own record ID (not the app's `id`
// column — see the fetchRecord() doc comment in airtable.ts). Useful once
// you have a record ID in hand from a prior list call, e.g. to refetch one
// row after an update rather than re-pulling the whole table.
// ---------------------------------------------------------------------------

export async function fetchAccountByRecordId(recordId: string): Promise<Account | null> {
  const record = await fetchRecord<AirtableAccountFields>("accounts", recordId);
  return record ? mapAccount(record.fields) : null;
}

export async function fetchTransactionByRecordId(recordId: string): Promise<Transaction | null> {
  const record = await fetchRecord<AirtableTransactionFields>("transactions", recordId);
  return record ? mapTransaction(record.fields) : null;
}

export async function fetchCategoryByRecordId(recordId: string): Promise<Category | null> {
  const record = await fetchRecord<AirtableCategoryFields>("categories", recordId);
  return record ? mapCategory(record.fields) : null;
}

export async function fetchLoyaltyProgramByRecordId(recordId: string): Promise<LoyaltyProgram | null> {
  const record = await fetchRecord<AirtableLoyaltyProgramFields>("loyalty_programs", recordId);
  return record ? mapLoyaltyProgram(record.fields) : null;
}

export async function fetchLoyaltyTransactionByRecordId(recordId: string): Promise<LoyaltyTransaction | null> {
  const record = await fetchRecord<AirtableLoyaltyTransactionFields>("loyalty_transactions", recordId);
  return record ? mapLoyaltyTransaction(record.fields) : null;
}

// ---------------------------------------------------------------------------
// Writes. These mirror the exact logic already in the local-JSON routes
// (src/app/api/transactions/route.ts, .../[id]/route.ts, .../accounts/route.ts)
// — same validation, same defaults, same "only touch these fields on
// update" narrowness — just targeting Airtable instead of fs.writeFile.
// Not yet called from those routes; wiring that up is the next step.
// ---------------------------------------------------------------------------

export interface NewTransactionInput {
  account_id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  merchant?: string;
  date: string;
  note?: string;
}

export async function createTransactionInAirtable(input: NewTransactionInput): Promise<Transaction> {
  const fields: AirtableTransactionFields = {
    id: `txn_${Date.now()}`,
    account_id: input.account_id,
    type: input.type,
    amount: input.amount,
    category_id: input.category_id,
    merchant: input.merchant,
    date: input.date,
    note: input.note,
    created_at: new Date().toISOString(),
    // Snapshot at creation time - same as the local route's raw_data.
    raw_data_merchant: input.merchant,
    raw_data_category_id: input.category_id,
    raw_data_note: input.note,
    edited: false,
  };
  const created = await createRecord<AirtableTransactionFields>("transactions", fields);
  return mapTransaction(created.fields);
}

export interface NewTransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  date: string;
  note?: string;
}

/**
 * Creates both legs of a transfer in a single Airtable request (the batch
 * create endpoint takes up to 10 records per call, so 2 is one request, not
 * two) — same "credit card bill payment, ATM withdrawal" pattern as the
 * local route, just atomic across both rows instead of writing a JSON file
 * twice.
 */
export async function createTransferInAirtable(input: NewTransferInput): Promise<[Transaction, Transaction]> {
  const now = Date.now();
  const transferId = `tr_${now}`;
  const outId = `txn_${now}_out`;
  const inId = `txn_${now}_in`;
  const createdAt = new Date().toISOString();

  const outFields: AirtableTransactionFields = {
    id: outId,
    account_id: input.from_account_id,
    type: "transfer",
    amount: input.amount,
    category_id: "cat_transfer",
    date: input.date,
    note: input.note,
    created_at: createdAt,
    transfer_id: transferId,
    transfer_direction: "out",
    linked_account_id: input.to_account_id,
    linked_transaction_id: inId,
    raw_data_category_id: "cat_transfer",
    raw_data_note: input.note,
    edited: false,
  };

  const inFields: AirtableTransactionFields = {
    id: inId,
    account_id: input.to_account_id,
    type: "transfer",
    amount: input.amount,
    category_id: "cat_transfer",
    date: input.date,
    note: input.note,
    created_at: createdAt,
    transfer_id: transferId,
    transfer_direction: "in",
    linked_account_id: input.from_account_id,
    linked_transaction_id: outId,
    raw_data_category_id: "cat_transfer",
    raw_data_note: input.note,
    edited: false,
  };

  const [createdOut, createdIn] = await createRecords<AirtableTransactionFields>("transactions", [
    { fields: outFields },
    { fields: inFields },
  ]);
  return [mapTransaction(createdOut.fields), mapTransaction(createdIn.fields)];
}

/**
 * Narrow update, by the app's own transaction id (e.g. "txn_001") - resolves
 * to Airtable's record ID internally. Only merchant/category_id are
 * editable here on purpose, exactly like the local PATCH route: raw_data is
 * never touched, regardless of what's passed in.
 */
export async function updateTransactionInAirtable(
  appId: string,
  updates: { merchant?: string; category_id?: string }
): Promise<Transaction | null> {
  const recordId = await findRecordIdByAppId("transactions", appId);
  if (!recordId) return null;

  const fields: Partial<AirtableTransactionFields> = { edited: true };
  if (updates.merchant !== undefined) fields.merchant = updates.merchant;
  if (updates.category_id) fields.category_id = updates.category_id;

  const updated = await updateRecord<AirtableTransactionFields>("transactions", recordId, fields);
  return mapTransaction(updated.fields);
}

export interface NewAccountInput {
  name: string;
  type: AccountType;
  institution?: string;
  initial_balance: number;
  currency?: string;
  account_subtype?: string;
  last_four?: string;
  is_primary?: boolean;
  ifsc_code?: string;
  account_holder?: string;
  opened_date?: string;
  card_color?: string;
  credit_limit?: number;
  statement_day?: number;
  due_day?: number;
  payment_reminder?: boolean;
  parent_account_id?: string;
  shares_credit_limit?: boolean;
}

export async function createAccountInAirtable(input: NewAccountInput): Promise<Account> {
  const fields: AirtableAccountFields = {
    id: `acc_${Date.now()}`,
    name: input.name,
    type: input.type,
    institution: input.institution,
    initial_balance: input.initial_balance,
    currency: input.currency ?? "INR",
    status: "active",
    account_subtype: input.account_subtype,
    last_four: input.last_four,
    is_primary: Boolean(input.is_primary),
    ifsc_code: input.ifsc_code,
    account_holder: input.account_holder,
    opened_date: input.opened_date,
    card_color: input.card_color,
    credit_limit: input.credit_limit,
    statement_day: input.statement_day,
    due_day: input.due_day,
    payment_reminder: input.payment_reminder,
    parent_account_id: input.parent_account_id,
    shares_credit_limit: input.shares_credit_limit,
  };

  // If this account is marked primary, un-mark any other account of the
  // same type first - same "only one primary per type" rule as the local route.
  if (fields.is_primary) {
    const existing = await fetchAllRecords<AirtableAccountFields>("accounts");
    const toUnmark = existing.filter(
      (r) => r.fields.type === fields.type && r.fields.is_primary === true
    );
    if (toUnmark.length > 0) {
      await updateRecords<AirtableAccountFields>(
        "accounts",
        toUnmark.map((r) => ({ id: r.id, fields: { is_primary: false } }))
      );
    }
  }

  const created = await createRecord<AirtableAccountFields>("accounts", fields);
  return mapAccount(created.fields);
}
