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
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar name={username} size="sm" />
          <span className="text-sm font-medium">{username}</span>
        </div>
        <ThemeAccentToggle />
      </header>
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
    </div>
  );
}
