"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

export default function AddCashAccountPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("Cash");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!nickname) return setError("Enter a name for this account.");
    if (!balance) return setError("Enter the current balance.");

    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nickname,
          type: "cash",
          initial_balance: Number(balance),
          account_subtype: "Cash on Hand",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save. Please try again.");
      }
      router.push("/accounts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <Link href="/accounts/add" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft size={16} />
        Add Account
      </Link>

      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Add Cash Account</h1>

      <div className="mb-5 space-y-4">
        <div>
          <label className={labelClass}>Nickname</label>
          <input
            type="text"
            autoComplete="off"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Cash, Wallet"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Current Balance</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="₹ 0.00"
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-expense">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl2 bg-brand py-3.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Account"}
      </button>
    </div>
  );
}
