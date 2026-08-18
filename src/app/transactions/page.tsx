"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getTransactions, getCategoryById, formatCurrency, formatShortDate } from "@/lib/finance";
import CategoryIcon from "@/components/CategoryIcon";
import type { TransactionType } from "@/lib/types";

const FILTERS: { label: string; value: "all" | TransactionType }[] = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

export default function TransactionsPage() {
  const allTransactions = useMemo(() => getTransactions(), []);
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [query, setQuery] = useState("");

  const filtered = allTransactions.filter((t) => {
    const matchesFilter = filter === "all" || t.type === filter;
    const category = getCategoryById(t.category_id);
    const haystack = `${t.note ?? ""} ${category?.name ?? ""}`.toLowerCase();
    const matchesQuery = query.trim() === "" || haystack.includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">Transactions</h1>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-brand text-white"
                : "bg-surface text-muted border border-border"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl2 border border-border bg-surface p-2 shadow-card">
        {filtered.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted">
            No transactions match your search.
          </p>
        )}
        <div className="divide-y divide-border">
          {filtered.map((t) => {
            const category = getCategoryById(t.category_id);
            const isIncome = t.type === "income";
            return (
              <div key={t.id} className="flex items-center gap-3 px-2 py-2.5">
                <CategoryIcon icon={category?.icon ?? "dots"} color={category?.color ?? "#8A9694"} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {t.note || category?.name || "Transaction"}
                  </div>
                  <div className="text-xs text-muted">
                    {category?.name} · {formatShortDate(t.date)}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-sm font-semibold ${
                    isIncome ? "text-income" : "text-ink"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {formatCurrency(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
