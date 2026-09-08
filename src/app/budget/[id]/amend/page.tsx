import { notFound } from "next/navigation";
import { getBudgets, getBudgetVersions, getActiveVersion } from "@/lib/budget";
import { getCategories } from "@/lib/finance";
import AmendBudgetForm from "@/components/AmendBudgetForm";

// Always render on demand for any id - never statically prerendered.
export const dynamicParams = true;

export default async function AmendBudgetPage({ params }: { params: { id: string } }) {
  const [budgets, versions, categories] = await Promise.all([
    getBudgets(),
    getBudgetVersions(),
    getCategories(),
  ]);

  const budget = budgets.find((b) => b.id === params.id);
  if (!budget) notFound();

  const category = categories.find((c) => c.id === budget.category_id);
  const currentVersion = getActiveVersion(budget.id, versions, new Date());

  return <AmendBudgetForm budgetId={budget.id} category={category} currentVersion={currentVersion} />;
}
