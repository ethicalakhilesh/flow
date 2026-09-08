import { getAccounts } from "@/lib/finance";
import AddCreditCardForm from "@/components/AddCreditCardForm";

export default async function AddCreditCardPage() {
  const accounts = await getAccounts();
  // Only existing PRIMARY credit cards can be linked to — an add-on can't
  // itself have add-ons, so cards that are already add-ons are excluded.
  const existingPrimaryCards = accounts.filter((a) => a.type === "credit_card" && !a.parent_account_id);

  return <AddCreditCardForm existingPrimaryCards={existingPrimaryCards} />;
}
