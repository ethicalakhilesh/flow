"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { BudgetPeriodType, BudgetVersion, Category } from "@/lib/types";

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

export default function AmendBudgetForm({
  budgetId,
  category,
  currentVersion,
}: {
  budgetId: string;
  category?: Category;
  currentVersion: BudgetVersion | null;
}) {
  const router = useRouter();

  const [periodType, setPeriodType] = useState<BudgetPeriodType>(currentVersion?.period_type ?? "month");
  const [weekday, setWeekday] = useState(currentVersion?.period_type === "week" ? currentVersion.recurrence_day ?? 0 : 0);
  const [monthDay, setMonthDay] = useState(
    String(currentVersion?.period_type === "month" ? currentVersion.recurrence_day ?? 1 : 1)
  );
  const [amount, setAmount] = useState(currentVersion ? String(currentVersion.amount) : "");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) return setError("Enter an amount greater than 0.");
    if (periodType === "month" && (Number(monthDay) < 1 || Number(monthDay) > 31)) {
      return setError("Day of month should be between 1 and 31.");
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/budgets/${budgetId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      router.push(`/budget/${budgetId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this amendment. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <Link
        href={`/budget/${budgetId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted"
      >
        <ChevronLeft size={16} />
        {category?.name ?? "Budget"}
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Amend Budget</h1>
      <p className="mb-5 text-sm text-muted">
        This creates a new version effective from the date below — periods before that date keep
        using the current amount, nothing already recorded changes.
      </p>

      <div className="mb-4">
        <label className={labelClass}>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="₹ 0"
          className={inputClass}
        />
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
        <label className={labelClass}>Effective From</label>
        <input
          type="date"
          value={effectiveFrom}
          onChange={(e) => setEffectiveFrom(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="mb-3 text-sm text-expense">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl2 bg-brand py-3.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Amendment"}
      </button>
    </div>
  );
}
