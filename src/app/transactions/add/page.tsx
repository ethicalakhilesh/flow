"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Delete } from "lucide-react";
import { getAccounts, getCategories } from "@/lib/finance";
import type { TransactionType } from "@/lib/types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"];

export default function AddTransactionPage() {
  const router = useRouter();
  const accounts = useMemo(() => getAccounts(), []);
  const categories = useMemo(() => getCategories(), []);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [merchant, setMerchant] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relevantCategories = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));

  function pressKey(key: string) {
    if (key === "back") {
      setAmount((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
      return;
    }
    if (key === "." && amount.includes(".")) return;
    setAmount((prev) => {
      if (prev === "0" && key !== ".") return key;
      return prev + key;
    });
  }

  async function handleSave() {
    setError(null);
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    if (!categoryId) {
      setError("Select a category.");
      return;
    }
    if (!accountId) {
      setError("Select an account.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          type,
          amount: numericAmount,
          category_id: categoryId,
          date,
          note,
          merchant: merchant || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save transaction");
      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError("Something went wrong saving this transaction. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <h1 className="mb-4 font-display text-2xl font-bold text-ink">Add Transaction</h1>

      {/* Type toggle */}
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-full bg-canvas p-1">
        <button
          onClick={() => {
            setType("expense");
            setCategoryId("");
          }}
          className={`rounded-full py-2 text-sm font-semibold transition-colors ${
            type === "expense" ? "bg-expense text-white" : "text-muted"
          }`}
        >
          Expense
        </button>
        <button
          onClick={() => {
            setType("income");
            setCategoryId("");
          }}
          className={`rounded-full py-2 text-sm font-semibold transition-colors ${
            type === "income" ? "bg-income text-white" : "text-muted"
          }`}
        >
          Income
        </button>
      </div>

      {/* Amount display */}
      <div className="mb-5 flex items-center justify-center gap-1 rounded-xl2 border border-border bg-surface py-6 shadow-card">
        <span className="font-display text-2xl font-semibold text-muted">₹</span>
        <span className="font-display text-4xl font-bold text-ink">{amount}</span>
      </div>

      {/* Detail rows */}
      <div className="mb-5 divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted">Category</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 truncate bg-transparent text-right text-sm font-medium text-ink focus:outline-none"
          >
            <option value="" disabled>
              Select category
            </option>
            {relevantCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronRight size={16} className="shrink-0 text-muted" />
        </label>

        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted">Account</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="flex-1 truncate bg-transparent text-right text-sm font-medium text-ink focus:outline-none"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <ChevronRight size={16} className="shrink-0 text-muted" />
        </label>

        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-right text-sm font-medium text-ink focus:outline-none"
          />
        </label>

        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted">Merchant</span>
          <input
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Starbucks (optional)"
            className="flex-1 truncate bg-transparent text-right text-sm font-medium text-ink placeholder:text-muted placeholder:font-normal focus:outline-none"
          />
        </label>

        <label className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-muted">Note</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="flex-1 truncate bg-transparent text-right text-sm font-medium text-ink placeholder:text-muted placeholder:font-normal focus:outline-none"
          />
        </label>
      </div>

      {/* Keypad */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            onClick={() => pressKey(key)}
            className="flex items-center justify-center rounded-xl2 border border-border bg-surface py-3.5 text-lg font-medium text-ink shadow-card active:bg-canvas"
          >
            {key === "back" ? <Delete size={18} /> : key}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-expense">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl2 bg-brand py-3.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Transaction"}
      </button>

      {selectedCategory && selectedAccount && (
        <p className="mt-3 text-center text-xs text-muted">
          {selectedCategory.name} · {selectedAccount.name}
        </p>
      )}
    </div>
  );
}
