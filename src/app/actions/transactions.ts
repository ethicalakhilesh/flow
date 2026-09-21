"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type TransactionInput,
  type TransactionFields,
} from "@/lib/airtableData";

function inputFromForm(formData: FormData): TransactionInput {
  return {
    account_id: String(formData.get("account_id")),
    type: formData.get("type") as TransactionFields["type"],
    amount: Number(formData.get("amount")),
    category_id: String(formData.get("category_id") || ""),
    merchant: String(formData.get("merchant") || ""),
    date: String(formData.get("date")),
    note: String(formData.get("note") || ""),
  };
}

export async function createTransactionAction(formData: FormData) {
  await createTransaction(inputFromForm(formData));
  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function updateTransactionAction(appId: string, formData: FormData) {
  await updateTransaction(appId, inputFromForm(formData));
  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}

export async function deleteTransactionAction(appId: string) {
  await deleteTransaction(appId);
  revalidatePath("/");
  revalidatePath("/transactions");
  redirect("/transactions");
}
