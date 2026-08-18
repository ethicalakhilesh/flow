"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Settings,
  Waves,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface md:px-4 md:py-6">
      <div className="flex items-center gap-2 px-2 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
          <Waves size={18} strokeWidth={2.5} />
        </div>
        <span className="font-display text-lg font-bold text-ink">Flow</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-light text-brand-dark"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <Settings size={18} strokeWidth={2.25} />
        Settings
      </Link>
    </aside>
  );
}
