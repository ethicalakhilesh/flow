import type { AccountFields } from "@/lib/airtableData";

const TYPES: AccountFields["type"][] = [
  "bank",
  "savings",
  "cash",
  "wallet",
  "credit_card",
  "investment",
  "loan",
];

export function AccountFormFields({ defaults }: { defaults?: Partial<AccountFields> }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          required
          defaultValue={defaults?.name}
          className="rounded-card border border-border bg-surface p-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Type
        <select
          name="type"
          required
          defaultValue={defaults?.type ?? "bank"}
          className="rounded-card border border-border bg-surface p-3"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Initial balance
        <input
          type="number"
          step="0.01"
          name="initial_balance"
          required
          defaultValue={defaults?.initial_balance ?? 0}
          className="rounded-card border border-border bg-surface p-3"
        />
      </label>
    </div>
  );
}
