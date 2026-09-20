import { headers } from "next/headers";
import { ThemeAccentToggle } from "@/components/theme-accent-toggle";

export default function Home() {
  const username = headers().get("x-flow-user-username");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold">Hello World</h1>
        {username && <p className="text-sm text-text-secondary">Logged in as {username}</p>}
      </div>
      <span className="rounded-card bg-accent-bg px-3 py-1 text-sm text-accent-fg">
        Design tokens active
      </span>
      <ThemeAccentToggle />
    </main>
  );
}
