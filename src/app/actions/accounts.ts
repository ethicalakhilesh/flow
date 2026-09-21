"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAccount, updateAccount, archiveAccount, type AccountFields } from "@/lib/airtableData";

export async function createAccountAction(formData: FormData) {
  await createAccount({
    name: String(formData.get("name")),
    type: formData.get("type") as AccountFields["type"],
    initial_balance: Number(formData.get("initial_balance")),
  });
  revalidatePath("/");
  redirect("/");
}

export async function updateAccountAction(appId: string, formData: FormData) {
  await updateAccount(appId, {
    name: String(formData.get("name")),
    type: formData.get("type") as AccountFields["type"],
    initial_balance: Number(formData.get("initial_balance")),
  });
  revalidatePath("/");
  redirect("/");
}

export async function archiveAccountAction(appId: string) {
  await archiveAccount(appId);
  revalidatePath("/");
  redirect("/");
}
