"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Plus, Wallet, Award, PiggyBank } from "lucide-react";

const LEFT_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budget", label: "Budget", icon: PiggyBank },
];

const RIGHT_ITEMS = [
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/memberships", label: "Memberships", icon: Award },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="relative mx-auto flex max-w-md items-center justify-between px-1.5 py-2">
        {LEFT_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium ${
              isActive(href) ? "text-brand" : "text-muted"
            }`}
          >
            <Icon size={20} strokeWidth={2.25} />
            {label}
          </Link>
        ))}

        <Link
          href="/transactions/add"
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand text-white shadow-card"
          aria-label="Add transaction"
        >
          <Plus size={26} strokeWidth={2.5} />
        </Link>

        <div className="w-[52px]" aria-hidden />

        {RIGHT_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium ${
              isActive(href) ? "text-brand" : "text-muted"
            }`}
          >
            <Icon size={20} strokeWidth={2.25} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
