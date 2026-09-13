"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { LoyaltyCategory } from "@/lib/types";

const CATEGORIES: { label: string; value: LoyaltyCategory }[] = [
  { label: "Airline", value: "airline" },
  { label: "Hotel", value: "hotel" },
  { label: "Other", value: "other" },
];

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

export default function AddMembershipPage() {
  const router = useRouter();

  const [brand, setBrand] = useState("");
  const [programName, setProgramName] = useState("");
  const [pointsName, setPointsName] = useState("");
  const [category, setCategory] = useState<LoyaltyCategory>("airline");
  const [memberId, setMemberId] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [tier, setTier] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!brand) return setError("Enter a brand name.");
    if (!programName) return setError("Enter the program name.");
    if (!pointsName) return setError("Enter what the points/miles are called.");

    setSaving(true);
    try {
      const res = await fetch("/api/loyalty-programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          program_name: programName,
          points_name: pointsName,
          category,
          member_id: memberId || undefined,
          starting_balance: startingBalance ? Number(startingBalance) : 0,
          tier: tier || undefined,
          expiry_date: expiryDate || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to save. Please try again.");
      }
      router.push("/memberships");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving this membership. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <Link href="/memberships" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft size={16} />
        Memberships
      </Link>

      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Add Membership</h1>

      <div className="mb-4 space-y-4">
        <div>
          <label className={labelClass}>Brand</label>
          <input
            type="text"
            autoComplete="off"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Marriott"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Program Name</label>
          <input
            type="text"
            autoComplete="off"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="e.g. Marriott Bonvoy"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Points Name</label>
          <input
            type="text"
            autoComplete="off"
            value={pointsName}
            onChange={(e) => setPointsName(e.target.value)}
            placeholder="e.g. Bonvoy Points, Avios, SuperCoins"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <div className="grid grid-cols-3 gap-1.5 rounded-full bg-canvas p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full py-1.5 text-xs font-semibold transition-colors ${
                  category === c.value ? "bg-brand text-white" : "text-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Member ID (Optional)</label>
          <input
            type="text"
            autoComplete="off"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="e.g. MB4455667"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Starting Balance</label>
          <input
            type="number"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Tier (Optional)</label>
          <input
            type="text"
            autoComplete="off"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            placeholder="e.g. Gold Elite"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Expiry Date (Optional)</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Redeem via SmartBuy for best value"
            rows={2}
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
        {saving ? "Saving..." : "Save Membership"}
      </button>
    </div>
  );
}
