"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { BudgetPeriodType, Category } from "@/lib/types";

const WEEKDAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

export default function AddBudgetForm({ availableCategories }: { availableCategories: Category[] }) {
  const router = useRouter();

  const [categoryId, setCategoryId] = useState(availableCategories[0]?.id ?? "");
  const [periodType, setPeriodType] = useState<BudgetPeriodType>("month");
  const [weekday, setWeekday] = useState(0);
  const [monthDay, setMonthDay] = useState("1");
  const [amount, setAmount] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!categoryId) return setError("Select a category.");
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return setError("Enter an amount greater than 0.");
    if (periodType === "month" && (Number(monthDay) < 1 || Number(monthDay) > 31)) {
      return setError("Day of month should be between 1 and 31.");
    }

    setSaving(true);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          amount: numericAmount,
          period_type: periodType,
          recurrence_day: periodType === "week" ? weekday : periodType === "month" ? Number(monthDay) : undefined,
          effective_from: effectiveFrom,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save. Please try again.");
      }
      router.push("/budget");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this budget. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (availableCategories.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
        <Link href="/budget" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
          <ChevronLeft size={16} />
          Budget
        </Link>
        <div className="rounded-xl2 border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-muted">
            Every expense category already has a budget. Amend an existing one instead, or
            deactivate one first to reuse its category.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <Link href="/budget" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft size={16} />
        Budget
      </Link>

      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Add Budget</h1>

      <div className="mb-4 space-y-4">
        <div>
          <label className={labelClass}>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="₹ 0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mb-4 rounded-xl2 border border-border bg-surface p-4 shadow-card">
        <label className={labelClass}>Period</label>
        <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-full bg-canvas p-1">
          {(["day", "week", "month"] as BudgetPeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              className={`rounded-full py-1.5 text-xs font-semibold capitalize transition-colors ${
                periodType === p ? "bg-brand text-white" : "text-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {periodType === "week" && (
          <div>
            <label className={labelClass}>Resets every</label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWeekday(w.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    weekday === w.value
                      ? "border-brand bg-brand-light text-brand-dark"
                      : "border-border bg-surface text-muted"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {periodType === "month" && (
          <div>
            <label className={labelClass}>Resets on day of month</label>
            <input
              type="number"
              min={1}
              max={31}
              value={monthDay}
              onChange={(e) => setMonthDay(e.target.value)}
              placeholder="1"
              className={`${inputClass} w-24`}
            />
          </div>
        )}

        {periodType === "day" && <p className="text-xs text-muted">Resets every calendar day.</p>}
      </div>

      <div className="mb-5">
        <label className={labelClass}>Starts From</label>
        <input
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p role="alert" aria-live="polite" className="mb-3 text-sm text-expense">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl2 bg-brand py-3.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save Budget"}
      </button>
    </div>
  );
}
