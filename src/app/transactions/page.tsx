"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { getTransactions, getCategoryById, getAccounts, getCategories } from "@/lib/finance";
import TransactionRow from "@/components/TransactionRow";
import TransactionFilterSheet from "@/components/TransactionFilterSheet";
import {
  DEFAULT_FILTERS,
  applyFilters,
  countActiveFilters,
  type TransactionFilters,
} from "@/lib/transactionFilters";

// Reads the `?account=` query param (set by "View All" on an account detail
// page) to pre-filter the list. Wrapped in Suspense because useSearchParams
// requires it in the app router, even in a fully client-rendered page.
function TransactionsPageInner() {
  const searchParams = useSearchParams();
  const accountParam = searchParams.get("account");

  const allTransactions = useMemo(() => getTransactions(), []);
  const accounts = useMemo(() => getAccounts(), []);
  const categories = useMemo(() => getCategories(), []);

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<TransactionFilters>(() =>
    accountParam ? { ...DEFAULT_FILTERS, accountIds: [accountParam] } : DEFAULT_FILTERS
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const filteredAccountName = accountParam ? accounts.find((a) => a.id === accountParam)?.name : null;

  const filtered = useMemo(() => {
    const byFilters = applyFilters(allTransactions, accounts, filters);
    if (query.trim() === "") return byFilters;
    return byFilters.filter((t) => {
      const category = getCategoryById(t.category_id);
      const haystack = `${t.merchant ?? ""} ${t.note ?? ""} ${category?.name ?? ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [allTransactions, accounts, filters, query]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Transactions</h1>
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
          {filtered.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </div>
      </div>

      <TransactionFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        onChange={setFilters}
        accounts={accounts}
        categories={categories}
        transactions={allTransactions}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsPageInner />
    </Suspense>
  );
}
