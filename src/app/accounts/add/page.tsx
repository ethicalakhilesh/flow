import Link from "next/link";
import { ChevronLeft, ChevronRight, Landmark, CreditCard, Wallet, Smartphone } from "lucide-react";

const OPTIONS = [
  {
    href: "/accounts/add/bank",
    icon: Landmark,
    title: "Bank Account",
    description: "Add your savings, salary, or current account",
  },
  {
    href: "/accounts/add/credit-card",
    icon: CreditCard,
    title: "Credit Card",
    description: "Add your credit card to track expenses",
  },
  {
    href: "/accounts/add/cash",
    icon: Wallet,
    title: "Cash Account",
    description: "Track cash you have on hand",
  },
  {
    href: "/accounts/add/wallet",
    icon: Smartphone,
    title: "Digital Wallet",
    description: "Add your UPI or wallet accounts",
  },
];

export default function AddAccountTypePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <Link href="/accounts" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft size={16} />
        Accounts
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">Add Account</h1>
      <p className="mb-5 text-sm text-muted">Choose the type of account</p>

      <div className="divide-y divide-border rounded-xl2 border border-border bg-surface shadow-card">
        {OPTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[22%] bg-brand-light text-brand-dark">
              <Icon size={19} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink">{title}</div>
              <div className="truncate text-xs text-muted">{description}</div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
