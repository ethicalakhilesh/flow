"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Check, X as XIcon } from "lucide-react";
import { formatCurrency } from "@/lib/finance";
import type { Account, Category, Transaction } from "@/lib/types";
import MerchantIcon from "@/components/MerchantIcon";

export default function TransactionDetailClient({
  transaction,
  categories,
  accounts,
}: {
  transaction: Transaction;
  categories: Category[];
  accounts: Account[];
}) {
  const router = useRouter();
  const account = accounts.find((a) => a.id === transaction.account_id);
  const category = categories.find((c) => c.id === transaction.category_id);

  const [editing, setEditing] = useState(false);
  const [merchant, setMerchant] = useState(transaction.merchant ?? "");
  const [categoryId, setCategoryId] = useState(transaction.category_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relevantCategories = categories.filter((c) => c.type === transaction.type);
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const linkedAccount = accounts.find((a) => a.id === transaction.linked_account_id);

  const dateLabel = new Date(transaction.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = new Date(transaction.created_at).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant, category_id: categoryId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save. Please try again.");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setMerchant(transaction.merchant ?? "");
    setCategoryId(transaction.category_id);
    setEditing(false);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/transactions"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted"
      >
        <ChevronLeft size={16} />
        Transactions
      </Link>

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <MerchantIcon merchant={transaction.merchant} category={category} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold text-ink">
            {transaction.merchant || transaction.note || category?.name || "Transaction"}
          </h1>
          <p className="text-sm text-muted">{category?.name}</p>
        </div>
        <div className={`shrink-0 font-display text-xl font-bold ${isTransfer ? "text-ink" : isIncome ? "text-income" : "text-ink"}`}>
          {isTransfer ? (transaction.transfer_direction === "in" ? "+" : "−") : isIncome ? "+" : "−"}
          {formatCurrency(transaction.amount)}
        </div>
      </div>

      {/* Core details */}
      <div className="mb-4 divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
        <DetailRow label="Transaction ID" value={transaction.id} mono />
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Time" value={timeLabel} />
        <DetailRow label="Type" value={isTransfer ? "Transfer" : isIncome ? "Credit" : "Debit"} />
        <DetailRow
          label="Source"
          value={account ? `${account.name}${account.institution && account.institution !== account.name ? ` · ${account.institution}` : ""}` : "—"}
        />
        {isTransfer && linkedAccount && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted">
              {transaction.transfer_direction === "out" ? "Transferred To" : "Transferred From"}
            </span>
            {transaction.linked_transaction_id ? (
              <Link
                href={`/transactions/${transaction.linked_transaction_id}`}
                className="text-sm font-medium text-brand"
              >
                {linkedAccount.name} →
              </Link>
            ) : (
              <span className="text-sm font-medium text-ink">{linkedAccount.name}</span>
            )}
          </div>
        )}
        {transaction.note && <DetailRow label="Note" value={transaction.note} />}
      </div>

      {/* Editable fields */}
      <div className="mb-4 rounded-xl2 border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-ink">
            Merchant &amp; Category
            {transaction.edited && (
              <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-muted">
                Edited
              </span>
            )}
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-xs font-medium text-brand"
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 focus-within:bg-canvas">
            <span className="text-sm text-muted">Merchant Name / Ref</span>
            {editing ? (
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Merchant name"
                autoComplete="off"
                className="flex-1 truncate bg-transparent text-right text-sm font-medium text-ink placeholder:text-muted placeholder:font-normal focus:outline-none"
              />
            ) : (
              <span className="truncate text-sm font-medium text-ink">
                {transaction.merchant || "—"}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 focus-within:bg-canvas">
            <span className="text-sm text-muted">Category</span>
            {editing ? (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex-1 truncate bg-transparent text-right text-sm font-medium text-ink focus:outline-none"
              >
                {relevantCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-ink">{category?.name ?? "—"}</span>
            )}
          </div>
        </div>

        {editing && (
          <div className="flex gap-2 border-t border-border px-4 py-3">
            <button
              onClick={cancelEdit}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl2 border border-border py-2 text-sm font-semibold text-ink disabled:opacity-60"
            >
              <XIcon size={15} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl2 bg-brand py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Check size={15} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
        {error && <p role="alert" aria-live="polite" className="px-4 pb-3 text-xs text-expense">{error}</p>}
      </div>

      {/* Raw data - untouched original record */}
      {transaction.raw_data && (
        <div className="rounded-xl2 border border-border bg-surface shadow-card">
          <div className="px-4 py-3">
            <span className="text-sm font-semibold text-ink">Raw Data</span>
            <p className="mt-0.5 text-xs text-muted">
              Original values as first parsed or entered. Never changes when you edit above.
            </p>
          </div>
          <div className="border-t border-border px-4 py-3">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-canvas p-3 font-mono text-xs text-ink">
{JSON.stringify(transaction.raw_data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-muted">{label}</span>
      <span className={`truncate text-sm font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
