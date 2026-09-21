"use client";

import { useState } from "react";
import type { TransactionFields, AccountFields, CategoryFields } from "@/lib/airtableData";
import { todayISTDateString } from "@/lib/ist-date";

export function TransactionFormFields({
  defaults,
  accounts,
  categories,
}: {
  defaults?: Partial<TransactionFields>;
  accounts: AccountFields[];
  categories: CategoryFields[];
}) {
  const today = todayISTDateString();
  const [type, setType] = useState(defaults?.type ?? "expense");

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Account
        <select
          name="account_id"
          required
          defaultValue={defaults?.account_id}
          className="rounded-card border border-border bg-surface p-3"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Type
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as TransactionFields["type"])}
          className="rounded-card border border-border bg-surface p-3"
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
      </label>
      {type === "transfer" && (
        <label className="flex flex-col gap-1 text-sm">
          To account
          <select
            name="to_account_id"
            required
            defaultValue={defaults?.linked_account_id}
            className="rounded-card border border-border bg-surface p-3"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Amount
        <input
          type="number"
          step="0.01"
          min="0"
          name="amount"
          required
          defaultValue={defaults?.amount}
          className="rounded-card border border-border bg-surface p-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Category
        <select
          name="category_id"
          defaultValue={defaults?.category_id ?? ""}
          className="rounded-card border border-border bg-surface p-3"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Merchant
        <input
          name="merchant"
          defaultValue={defaults?.merchant}
          className="rounded-card border border-border bg-surface p-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Date
        <input
          type="date"
          name="date"
          required
          defaultValue={defaults?.date ?? today}
          className="rounded-card border border-border bg-surface p-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Note
        <textarea
          name="note"
          defaultValue={defaults?.note}
          className="rounded-card border border-border bg-surface p-3"
        />
      </label>
    </div>
  );
}
