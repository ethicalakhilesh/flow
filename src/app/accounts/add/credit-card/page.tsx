"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAccounts } from "@/lib/finance";
import Toggle from "@/components/Toggle";

const BANK_NAMES = ["HDFC Bank", "ICICI Bank", "Axis Bank", "IDFC FIRST Bank", "Federal Bank"];

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-brand";
const labelClass = "mb-1.5 block text-xs font-medium text-muted";

export default function AddCreditCardPage() {
  const router = useRouter();

  // Only existing PRIMARY credit cards can be linked to — an add-on can't
  // itself have add-ons, so cards that are already add-ons are excluded.
  const existingPrimaryCards = useMemo(
    () => getAccounts().filter((a) => a.type === "credit_card" && !a.parent_account_id),
    []
  );

  const [provider, setProvider] = useState(BANK_NAMES[0] ?? "");
  const [cardName, setCardName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [currentDue, setCurrentDue] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [paymentReminder, setPaymentReminder] = useState(true);

  const [isAddon, setIsAddon] = useState(false);
  const [parentAccountId, setParentAccountId] = useState(existingPrimaryCards[0]?.id ?? "");
  const [sharesLimit, setSharesLimit] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!cardName) return setError("Enter a card name.");
    if (lastFour && !/^\d{4}$/.test(lastFour)) return setError("Card number should be the last 4 digits.");
    if (isAddon && !parentAccountId) return setError("Select the primary card this add-on belongs to.");
    if (!isAddon || !sharesLimit) {
      if (statementDay && (Number(statementDay) < 1 || Number(statementDay) > 31)) {
        return setError("Statement date should be a day between 1 and 31.");
      }
      if (dueDay && (Number(dueDay) < 1 || Number(dueDay) > 31)) {
        return setError("Due date should be a day between 1 and 31.");
      }
    }

    setSaving(true);
    try {
      // "Current Due Amount" is the balance the card starts at — same role
      // initial_balance plays for every other account type, just entered
      // as a positive "amount owed" here and stored as negative debt.
      const startingBalance = currentDue ? -Math.abs(Number(currentDue)) : 0;
      const pooling = isAddon && sharesLimit;

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cardName,
          type: "credit_card",
          institution: provider,
          initial_balance: startingBalance,
          account_subtype: "Credit Card",
          last_four: lastFour || undefined,
          // Pooled add-ons don't carry their own limit/billing dates — they
          // inherit the primary's via parent_account_id + shares_credit_limit.
          credit_limit: pooling ? undefined : creditLimit ? Number(creditLimit) : undefined,
          statement_day: pooling ? undefined : statementDay ? Number(statementDay) : undefined,
          due_day: pooling ? undefined : dueDay ? Number(dueDay) : undefined,
          payment_reminder: paymentReminder,
          parent_account_id: isAddon ? parentAccountId : undefined,
          shares_credit_limit: isAddon ? sharesLimit : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.push("/accounts");
      router.refresh();
    } catch {
      setError("Something went wrong saving this card. Please try again.");
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

      <h1 className="mb-5 font-display text-2xl font-bold text-ink">Add Credit Card</h1>

      <div className="mb-4 space-y-4">
        <div>
          <label className={labelClass}>Card Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass}>
            {BANK_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Card Name</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="e.g. HDFC Regalia"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Last 4 Digits</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
            placeholder="8932"
            className={inputClass}
          />
        </div>
      </div>

      {/* Add-on card linkage */}
      {existingPrimaryCards.length > 0 && (
        <div className="mb-4 divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
          <Toggle checked={isAddon} onChange={setIsAddon} label="Link as an add-on card" />
          {isAddon && (
            <>
              <div className="px-4 py-3">
                <label className={labelClass}>Primary Card</label>
                <select
                  value={parentAccountId}
                  onChange={(e) => setParentAccountId(e.target.value)}
                  className={inputClass}
                >
                  {existingPrimaryCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Toggle
                checked={sharesLimit}
                onChange={setSharesLimit}
                label="Share credit limit with primary card"
              />
            </>
          )}
        </div>
      )}

      <div className="mb-4 space-y-4">
        {/* Credit limit only applies when this card isn't pooling a primary's limit */}
        {!(isAddon && sharesLimit) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Credit Limit</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="₹ 1,50,000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Current Due Amount</label>
              <input
                type="number"
                value={currentDue}
                onChange={(e) => setCurrentDue(e.target.value)}
                placeholder="₹ 0"
                className={inputClass}
              />
            </div>
          </div>
        )}
        {isAddon && sharesLimit && (
          <div>
            <label className={labelClass}>Current Due Amount (this card's own spend)</label>
            <input
              type="number"
              value={currentDue}
              onChange={(e) => setCurrentDue(e.target.value)}
              placeholder="₹ 0"
              className={inputClass}
            />
          </div>
        )}

        {/* Statement/due dates only apply when not inheriting the primary's billing cycle */}
        {!(isAddon && sharesLimit) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Statement Date</label>
              <input
                type="number"
                min={1}
                max={31}
                value={statementDay}
                onChange={(e) => setStatementDay(e.target.value)}
                placeholder="25"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Due Date</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="15"
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mb-5 rounded-xl2 border border-border bg-surface shadow-card">
        <Toggle checked={paymentReminder} onChange={setPaymentReminder} label="Set payment reminder" />
      </div>

      {error && <p className="mb-3 text-sm text-expense">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl2 bg-brand py-3.5 text-sm font-semibold text-white shadow-card disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Card"}
      </button>
    </div>
  );
}
