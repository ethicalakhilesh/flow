export type AccountType = "bank" | "cash" | "wallet" | "credit_card" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution?: string;
  initial_balance: number;
  currency: string;
  status: "active" | "archived";
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number; // always positive; sign is derived from `type` (and `transfer_direction` for transfers)
  category_id: string;
  merchant?: string; // structured merchant/payee name, used for icon lookup
  date: string; // ISO date, e.g. 2026-05-24
  note?: string;
  created_at: string;
  /**
   * Immutable snapshot of merchant/category/note as originally parsed or
   * entered. Editing `merchant`/`category_id` above never touches this —
   * it's the "what the bank/PDF actually said" record, kept for reference
   * even after you've cleaned up the tracked category or merchant name.
   */
  raw_data?: {
    merchant?: string;
    category_id?: string;
    note?: string;
    source_text?: string; // raw parsed statement line, once the PDF pipeline is wired in
  };
  edited?: boolean; // true once merchant/category has been manually corrected from raw_data

  /**
   * Transfers (credit card bill payments, ATM withdrawals, moving money
   * between accounts) are stored as TWO linked transaction rows — one leg
   * per account — rather than a single row, so each account's balance
   * math stays a simple sum over its own rows. Both legs share a
   * `transfer_id`; `transfer_direction` says which way money moved for
   * *this* row's account ("out" = left this account, "in" = arrived).
   * Only set when `type === "transfer"`.
   */
  transfer_id?: string;
  transfer_direction?: "out" | "in";
  /** The *other* account in the pair, for display ("Transfer to Cash"). */
  linked_account_id?: string;
  /** The other leg's transaction id, for linking to it from the detail page. */
  linked_transaction_id?: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  icon: string; // key used to look up an icon component
  color: string; // hex, used for charts
}

export interface AccountWithBalance extends Account {
  current_balance: number;
}

export type LoyaltyCategory = "airline" | "hotel" | "other";

export interface LoyaltyProgram {
  id: string;
  brand: string; // e.g. "British Airways" — used for icon lookup
  program_name: string; // e.g. "Executive Club"
  points_name: string; // the actual currency: "Avios", "SuperCoins", "BlueChips", etc.
  category: LoyaltyCategory;
  member_id?: string;
  starting_balance: number; // balance before the earliest tracked transaction
  tier?: string; // e.g. "Gold", "Platinum"
  expiry_date?: string; // ISO date - points or tier expiry, if applicable
  notes?: string;
}

export type LoyaltyTransactionType = "earned" | "redeemed" | "expired" | "adjusted" | "transferred";

export interface LoyaltyTransaction {
  id: string;
  program_id: string;
  type: LoyaltyTransactionType;
  points: number; // always positive; sign is derived from `type`
  date: string; // ISO date
  description?: string; // e.g. "Flight BLR–LHR", "Redeemed for hotel stay"
}
