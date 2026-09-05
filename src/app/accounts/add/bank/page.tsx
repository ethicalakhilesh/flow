"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Toggle from "@/components/Toggle";

// Matches the keys in src/lib/bankIcons.ts BANK_ICON_MAP (lookup there is
// case-insensitive, so exact casing here just needs to read well).
const BANK_NAMES = ["HDFC Bank", "ICICI Bank", "Axis Bank", "IDFC FIRST Bank", "Federal Bank"];

const ACCOUNT_TYPES = [
  { label: "Savings Account", value: "savings" },
  { label: "Current Account", value: "bank" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

export default function AddBankAccountPage() {
  const router = useRouter();
  const [bankName, setBankName] = useState(BANK_NAMES[0] ?? "");
  const [accountType, setAccountType] = useState<"savings" | "bank">("savings");
  const [nickname, setNickname] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [balance, setBalance] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!bankName) return setError("Select a bank.");
    if (!balance) return setError("Enter the current balance.");
    if (lastFour && !/^\d{4}$/.test(lastFour)) return setError("Account number should be the last 4 digits.");

    setSaving(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nickname || bankName,
          type: accountType,
          institution: bankName,
          initial_balance: Number(balance),
          account_subtype: accountType === "savings" ? "Savings Account" : "Current Account",
          last_four: lastFour || undefined,
          is_primary: isPrimary,
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

      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Add Bank Account</h1>

      <div className="mb-4 space-y-4">
        <div>
          <label className={labelClass}>Bank Name</label>
          <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass}>
            {BANK_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Account Type</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as "savings" | "bank")}
            className={inputClass}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Account Nickname (Optional)</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Primary Savings"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Account Number (Last 4 Digits)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
            placeholder="4821"
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

      <div className="mb-5 rounded-xl2 border border-border bg-surface shadow-card">
        <Toggle checked={isPrimary} onChange={setIsPrimary} label="Set as primary account" />
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
