import Link from "next/link";
import { Plus } from "lucide-react";
import { getBudgets, getBudgetVersions, getBudgetsWithStatus } from "@/lib/budget";
import { getTransactions, getCategories } from "@/lib/finance";
import BudgetCard from "@/components/BudgetCard";

export default async function BudgetPage() {
  const [budgets, versions, transactions, categories] = await Promise.all([
    getBudgets(),
    getBudgetVersions(),
    getTransactions(),
    getCategories(),
  ]);

  const items = getBudgetsWithStatus(budgets, versions, categories, transactions);
  const overCount = items.filter((i) => i.status === "over").length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Budget</h1>
          <p className="text-sm text-muted">Spending limits by category</p>
        </div>
        <Link
          href="/budget/add"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white"
        >
          <Plus size={18} />
        </Link>
      </div>

      {overCount > 0 && (
        <div className="mb-4 rounded-xl2 border border-expense/30 bg-expense/10 px-4 py-2.5 text-sm text-expense">
          {overCount} {overCount === 1 ? "budget is" : "budgets are"} over limit this period.
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl2 border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-muted">
            No budgets set up yet. Add a spending limit for any category — daily, weekly, or
            monthly — to start tracking against it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <BudgetCard key={item.budget.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
