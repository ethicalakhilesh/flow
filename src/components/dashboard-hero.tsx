import Link from "next/link";

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
    </svg>
  );
}

export function DashboardHero({
  netWorth,
  monthChangePct,
}: {
  netWorth: string;
  monthChangePct: number;
}) {
  return (
    <div className="bg-foreground px-4 py-7">
      <div className="mx-auto flex max-w-md items-start justify-between">
        <div>
          <p className="text-sm text-gray-300">Net worth</p>
          <p className="mt-1 text-4xl font-medium text-background">{netWorth}</p>
          <span className="mt-3 inline-block rounded-card bg-white/15 px-3 py-1 text-xs text-background">
            {monthChangePct >= 0 ? "+" : ""}
            {monthChangePct}% this month
          </span>
        </div>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-background"
        >
          <UserIcon />
        </Link>
      </div>
    </div>
  );
}
