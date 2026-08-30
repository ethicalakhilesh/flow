"use client";

import { X } from "lucide-react";
import type { Account, Category, Transaction } from "@/lib/types";
import {
  type TransactionFilters,
  type SourceFilter,
  type TypeFilter,
  DEFAULT_FILTERS,
  eligibleAccountsForSource,
  getAvailableCategories,
} from "@/lib/transactionFilters";

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="grid gap-1.5 rounded-full bg-canvas p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-full py-1.5 text-xs font-semibold transition-colors ${
            value === opt.value ? "bg-brand text-white" : "text-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-brand bg-brand-light text-brand-dark"
          : "border-border bg-surface text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="mb-2.5 text-sm font-semibold text-ink">{title}</div>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-lg border border-border bg-canvas px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";

export default function TransactionFilterSheet({
  open,
  onClose,
  filters,
  onChange,
  accounts,
  categories,
  transactions,
}: {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
}) {
  if (!open) return null;

  function patch(partial: Partial<TransactionFilters>) {
    onChange({ ...filters, ...partial });
  }

  const eligibleAccounts = eligibleAccountsForSource(accounts, filters.source);
  const availableCategories = getAvailableCategories(transactions, accounts, categories, filters);

  function toggleAccount(id: string) {
    const has = filters.accountIds.includes(id);
    patch({ accountIds: has ? filters.accountIds.filter((a) => a !== id) : [...filters.accountIds, id] });
  }

  function toggleCategory(id: string) {
    const has = filters.categoryIds.includes(id);
    patch({ categoryIds: has ? filters.categoryIds.filter((c) => c !== id) : [...filters.categoryIds, id] });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-xl2 bg-surface shadow-card md:rounded-xl2">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-ink">Filters</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-canvas">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <Section title="Type">
            <SegmentedControl<TypeFilter>
              value={filters.type}
              onChange={(type) => patch({ type })}
              options={[
                { label: "All", value: "all" },
                { label: "Credit", value: "credit" },
                { label: "Debit", value: "debit" },
              ]}
            />
          </Section>

          <Section title="Source">
            <SegmentedControl<SourceFilter>
              value={filters.source}
              onChange={(source) => patch({ source, accountIds: [] })}
              options={[
                { label: "All", value: "all" },
                { label: "Bank Account", value: "bank" },
                { label: "Credit Card", value: "credit_card" },
              ]}
            />
          </Section>

          <Section title="Account">
            <div className="flex flex-wrap gap-2">
              <Chip
                label={filters.source === "credit_card" ? "All Credit Cards" : filters.source === "bank" ? "All Bank Accounts" : "All Accounts"}
                active={filters.accountIds.length === 0}
                onClick={() => patch({ accountIds: [] })}
              />
              {eligibleAccounts.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  active={filters.accountIds.includes(a.id)}
                  onClick={() => toggleAccount(a.id)}
                />
              ))}
            </div>
          </Section>

          <Section title="Date">
            <SegmentedControl
              value={filters.date.mode}
              onChange={(mode) =>
                patch({
                  date: {
                    ...filters.date,
                    mode,
                    aroundDays: mode === "around" ? filters.date.aroundDays ?? 3 : filters.date.aroundDays,
                  },
                })
              }
              options={[
                { label: "Any", value: "none" },
                { label: "On", value: "specific" },
                { label: "± Days", value: "around" },
                { label: "Range", value: "range" },
              ]}
            />

            {filters.date.mode === "specific" && (
              <input
                type="date"
                value={filters.date.specificDate ?? ""}
                onChange={(e) => patch({ date: { ...filters.date, specificDate: e.target.value } })}
                className={`${inputClass} mt-3 w-full`}
              />
            )}

            {filters.date.mode === "around" && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="date"
                  value={filters.date.aroundDate ?? ""}
                  onChange={(e) => patch({ date: { ...filters.date, aroundDate: e.target.value } })}
                  className={`${inputClass} flex-1`}
                />
                <span className="text-xs text-muted">±</span>
                <input
                  type="number"
                  min={0}
                  value={filters.date.aroundDays ?? 3}
                  onChange={(e) =>
                    patch({ date: { ...filters.date, aroundDays: Number(e.target.value) } })
                  }
                  className={`${inputClass} w-16`}
                />
                <span className="text-xs text-muted">days</span>
              </div>
            )}

            {filters.date.mode === "range" && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="date"
                  value={filters.date.rangeStart ?? ""}
                  onChange={(e) => patch({ date: { ...filters.date, rangeStart: e.target.value } })}
                  className={`${inputClass} flex-1`}
                />
                <span className="text-xs text-muted">to</span>
                <input
                  type="date"
                  value={filters.date.rangeEnd ?? ""}
                  onChange={(e) => patch({ date: { ...filters.date, rangeEnd: e.target.value } })}
                  className={`${inputClass} flex-1`}
                />
              </div>
            )}
          </Section>

          <Section title="Amount">
            <SegmentedControl
              value={filters.amount.mode}
              onChange={(mode) => patch({ amount: { ...filters.amount, mode } })}
              options={[
                { label: "Any", value: "none" },
                { label: "Exact", value: "exact" },
                { label: "Range", value: "range" },
              ]}
            />

            {filters.amount.mode === "exact" && (
              <input
                type="number"
                min={0}
                placeholder="Amount"
                value={filters.amount.exact ?? ""}
                onChange={(e) =>
                  patch({ amount: { ...filters.amount, exact: e.target.value ? Number(e.target.value) : undefined } })
                }
                className={`${inputClass} mt-3 w-full`}
              />
            )}

            {filters.amount.mode === "range" && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={filters.amount.min ?? ""}
                  onChange={(e) =>
                    patch({ amount: { ...filters.amount, min: e.target.value ? Number(e.target.value) : undefined } })
                  }
                  className={`${inputClass} flex-1`}
                />
                <span className="text-xs text-muted">to</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={filters.amount.max ?? ""}
                  onChange={(e) =>
                    patch({ amount: { ...filters.amount, max: e.target.value ? Number(e.target.value) : undefined } })
                  }
                  className={`${inputClass} flex-1`}
                />
              </div>
            )}
          </Section>

          <Section title="Category">
            {availableCategories.length === 0 ? (
              <p className="text-xs text-muted">No categories match the current filters.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    active={filters.categoryIds.includes(c.id)}
                    onClick={() => toggleCategory(c.id)}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="flex gap-2 border-t border-border px-4 py-3">
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex-1 rounded-xl2 border border-border py-2.5 text-sm font-semibold text-ink"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl2 bg-brand py-2.5 text-sm font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
