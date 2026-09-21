import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { AccountFormFields } from "@/components/account-form-fields";
import { getAccount } from "@/lib/airtableData";
import { updateAccountAction, archiveAccountAction } from "@/app/actions/accounts";

export default async function EditAccount({ params }: { params: { id: string } }) {
  const username = headers().get("x-flow-user-username") ?? "Guest";
  const account = await getAccount(params.id);
  if (!account) notFound();

  const updateWithId = updateAccountAction.bind(null, account.id);
  const archiveWithId = archiveAccountAction.bind(null, account.id);

  return (
    <AppShell username={username}>
      <div className="flex flex-col gap-4">
        <Link href="/" className="text-sm text-text-secondary">
          ← Cancel
        </Link>
        <h1 className="text-xl font-medium">Edit account</h1>
        <form action={updateWithId} className="flex flex-col gap-4">
          <AccountFormFields defaults={account} />
          <button
            type="submit"
            className="rounded-card bg-accent py-3 text-sm font-medium text-white"
          >
            Save
          </button>
        </form>
        <form action={archiveWithId}>
          <button
            type="submit"
            className="w-full rounded-card border border-border py-3 text-sm font-medium text-text-secondary"
          >
            Archive account
          </button>
        </form>
      </div>
    </AppShell>
  );
}
