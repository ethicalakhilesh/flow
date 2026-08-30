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
  name: string; // e.g. "United MileagePlus"
  category: LoyaltyCategory;
  member_id?: string;
  points_balance: number;
  points_unit: string; // "miles", "points", "nights", etc.
  tier?: string; // e.g. "Gold", "Platinum"
  expiry_date?: string; // ISO date - points or tier expiry, if applicable
  notes?: string;
}
