import Link from "next/link";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { AccountFormFields } from "@/components/account-form-fields";
import { createAccountAction } from "@/app/actions/accounts";

export default function NewAccount() {
  const username = headers().get("x-flow-user-username") ?? "Guest";

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Link href="/" className="text-sm text-text-secondary">
          ← Cancel
        </Link>
        <h1 className="text-xl font-medium">Add account</h1>
        <form action={createAccountAction} className="flex flex-col gap-4">
          <AccountFormFields />
          <button
            type="submit"
            className="rounded-card bg-accent py-3 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
      </div>
    </AppShell>
  );
}
