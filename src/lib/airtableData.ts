import { fetchAllRecords } from "@/lib/airtable";
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
