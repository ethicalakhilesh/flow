"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Wallet, Award, PiggyBank } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budget", label: "Budget", icon: PiggyBank },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/memberships", label: "Memberships", icon: Award },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="fixed inset-x-0 z-40 flex justify-center px-4 md:hidden"
      // Floats above the home indicator / curved bottom corners rather than
      // sitting flush against them - viewport-fit=cover in layout.tsx's
      // viewport export is required for env(safe-area-inset-bottom) to
      // resolve to anything but 0 here.
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
    >
      <div className="flex w-full max-w-md items-center justify-between rounded-full border border-border bg-surface/95 px-2 py-1.5 shadow-card backdrop-blur">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "bg-brand-light text-brand-dark" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={2.25} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
