export type AccountType = "bank" | "cash" | "wallet" | "credit_card" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution?: string;
  initial_balance: number;
  currency: string;
  status: "active" | "archived";

  // Display / detail fields for the Accounts UI
  account_subtype?: string; // "Savings Account", "Salary Account", "Current Account" — shown under the name
  last_four?: string; // masked as •••• 1234
  is_primary?: boolean;
  ifsc_code?: string;
  account_holder?: string;
  opened_date?: string; // ISO date
  /**
   * Base hex color for this account's card face (e.g. "#003B7A"). Set per
   * account in the data, not editable anywhere in the UI — same pattern as
   * LoyaltyProgram.card_color. Falls back to the brand teal if unset.
   */
  card_color?: string;

  // Credit-card-specific fields (undefined for non-card accounts)
  credit_limit?: number;
  statement_day?: number; // day of month, 1-31
  due_day?: number; // day of month, 1-31
  payment_reminder?: boolean;

  /**
   * Add-on/supplementary card support. An add-on card points back at its
   * primary card via parent_account_id. If shares_credit_limit is true,
   * the add-on draws from the PRIMARY's credit_limit as a shared pool
   * instead of having its own — see getCardGroup()/getCreditCardUsage()
   * in finance.ts, which compute combined outstanding/available across
   * every account in the same limit-sharing group. An add-on can instead
   * have its own separate credit_limit by leaving shares_credit_limit
   * false/unset.
   */
  parent_account_id?: string;
  shares_credit_limit?: boolean;
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
  /**
   * Base hex color for this program's card face (e.g. "#5A2D82"). Set per
   * program in the data, not editable anywhere in the UI — MembershipCard
   * derives a gradient from it. Falls back to the brand teal if unset.
   */
  card_color?: string;
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
