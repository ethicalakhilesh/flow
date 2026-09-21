import Link from "next/link";
import { headers } from "next/headers";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-accent-toggle";
import { logoutAction } from "@/app/actions/auth";

export default function Profile() {
  const username = headers().get("x-flow-user-username") ?? "Guest";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-background px-4 py-4">
      <Link href="/" className="text-sm text-text-secondary">
        ← Back
      </Link>

      <div className="flex flex-col items-center gap-3 py-4">
        <Avatar name={username} size="lg" />
        <span className="text-lg font-medium">{username}</span>
      </div>

      <div className="flex items-center justify-between rounded-card bg-surface-muted p-4">
        <span className="text-sm">Theme</span>
        <ThemeToggle />
      </div>

      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full rounded-card border border-border py-3 text-sm font-medium text-danger"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
