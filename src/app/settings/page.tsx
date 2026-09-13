import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-8 md:py-8">
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted">
        <ChevronLeft size={16} />
        Dashboard
      </Link>

      <div className="flex flex-col items-center rounded-xl2 border border-border bg-surface px-6 py-12 text-center shadow-card">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
          <Settings size={22} />
        </div>
        <h1 className="mb-1 font-display text-lg font-bold text-ink">Settings</h1>
        <p className="max-w-xs text-sm text-muted">Coming soon.</p>
      </div>
    </div>
  );
}
