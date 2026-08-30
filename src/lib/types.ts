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
  amount: number; // always positive; sign is derived from `type`
  category_id: string;
  merchant?: string; // structured merchant/payee name, used for icon lookup
  date: string; // ISO date, e.g. 2026-05-24
  note?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
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
