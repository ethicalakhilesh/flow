"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { getCategoryById } from "@/lib/finance";
import type { Account, Category, Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";
import TransactionFilterSheet from "@/components/TransactionFilterSheet";
import {
  DEFAULT_FILTERS,
  applyFilters,
  countActiveFilters,
  type TransactionFilters,
} from "@/lib/transactionFilters";

const DEFAULT_VISIBLE_COUNT = 20;

// Reads the `?account=` query param (set by "View All" on an account detail
// page) to pre-filter the list. Wrapped in Suspense because useSearchParams
// requires it in the app router, even in a fully client-rendered component.
function TransactionsPageInner({
  transactions,
  accounts,
  categories,
}: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const accountParam = searchParams.get("account");

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>(() =>
    accountParam ? { ...DEFAULT_FILTERS, accountIds: [accountParam] } : DEFAULT_FILTERS
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const filteredAccountName = accountParam ? accounts.find((a) => a.id === accountParam)?.name : null;

  const filtered = useMemo(() => {
    const byFilters = applyFilters(transactions, accounts, filters);
    if (query.trim() === "") return byFilters;
    return byFilters.filter((t) => {
      const category = getCategoryById(t.category_id, categories);
      const haystack = `${t.merchant ?? ""} ${t.note ?? ""} ${category?.name ?? ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [transactions, accounts, categories, filters, query]);

  // No filters and no search = the default view, capped to the most recent
  // 20. The moment either is used, show every match - capping a filtered
  // result would be confusing (you asked for something specific, you
  // should see all of it).
  const isDefaultView = activeCount === 0 && query.trim() === "";
  const visible = isDefaultView ? filtered.slice(0, DEFAULT_VISIBLE_COUNT) : filtered;
  const isTruncated = isDefaultView && filtered.length > DEFAULT_VISIBLE_COUNT;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">Transactions</h1>
        <Link
          href="/transactions/add"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white"
          aria-label="Add transaction"
        >
          <Plus size={18} />
        </Link>
      </div>
      {filteredAccountName && (
        <p className="mb-3 text-sm text-muted">Showing transactions for {filteredAccountName}</p>
      )}
      {!filteredAccountName && <div className="mb-4" />}

      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <Search size={16} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions"
            className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
            activeCount > 0
              ? "border-brand bg-brand-light text-brand-dark"
              : "border-border bg-surface text-muted"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="rounded-xl2 border border-border bg-surface p-2 shadow-card">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted">
            No transactions match the current filters.
          </p>
        )}
        <div className="divide-y divide-border px-2">
          {visible.map((t) => (
            <TransactionRow key={t.id} transaction={t} categories={categories} accounts={accounts} />
          ))}
        </div>
      </div>
      {isTruncated && (
        <p className="mt-2 text-center text-xs text-muted">
          Showing the last {DEFAULT_VISIBLE_COUNT} of {filtered.length} — search or filter to see more.
        </p>
      )}

      <TransactionFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        onChange={setFilters}
        accounts={accounts}
        categories={categories}
        transactions={transactions}
      />
    </div>
  );
}

export default function TransactionsClient(props: {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}) {
  return (
    <Suspense fallback={null}>
      <TransactionsPageInner {...props} />
    </Suspense>
  );
}
