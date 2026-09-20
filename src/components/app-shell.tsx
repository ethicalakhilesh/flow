import { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ThemeAccentToggle } from "@/components/theme-accent-toggle";

export function AppShell({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={username} size="sm" />
          <span className="text-sm font-medium">{username}</span>
        </div>
        <ThemeAccentToggle />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
