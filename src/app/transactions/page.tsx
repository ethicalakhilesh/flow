"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getTransactions, getCategoryById } from "@/lib/finance";
import TransactionRow from "@/components/TransactionRow";
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
    const haystack = `${t.merchant ?? ""} ${t.note ?? ""} ${category?.name ?? ""}`.toLowerCase();
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
        <div className="divide-y divide-border px-2">
          {filtered.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
