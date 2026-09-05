"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

export default function AddWalletPage() {
  const router = useRouter();
  const [provider, setProvider] = useState("");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!provider) return setError("Enter the wallet name, e.g. PhonePe.");
    if (!balance) return setError("Enter the current balance.");

    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: provider,
          type: "wallet",
          initial_balance: Number(balance),
          account_subtype: "Digital Wallet",
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/accounts");
      router.refresh();
    } catch {
      setError("Something went wrong saving this account. Please try again.");
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

      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Add Digital Wallet</h1>

      <div className="mb-5 space-y-4">
        <div>
          <label className={labelClass}>Wallet Name</label>
          <input
            type="text"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. PhonePe, Paytm, Google Pay"
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
