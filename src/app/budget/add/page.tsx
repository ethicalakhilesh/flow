import { getCategories } from "@/lib/finance";
import { getBudgets } from "@/lib/budget";
import AddBudgetForm from "@/components/AddBudgetForm";

export default async function AddBudgetPage() {
  const [categories, budgets] = await Promise.all([getCategories(), getBudgets()]);

  const categoriesWithActiveBudget = new Set(
    budgets.filter((b) => b.active).map((b) => b.category_id)
  );
  const availableCategories = categories.filter(
    (c) => c.type === "expense" && !categoriesWithActiveBudget.has(c.id)
  );

  return <AddBudgetForm availableCategories={availableCategories} />;
}
