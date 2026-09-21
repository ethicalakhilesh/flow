import { ReactNode } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function AppShell({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <Link href="/profile" className="flex items-center gap-3">
          <Avatar name={username} size="sm" />
          <span className="text-sm font-medium">{username}</span>
        </Link>
      </header>
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
    </div>
  );
}
