"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";

export default function ProfileMenu({ username }: { username?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = username?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-white"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-card">
          {username && (
            <div className="truncate border-b border-border px-3 py-2 text-xs text-muted">
              Signed in as <span className="font-medium text-ink">{username}</span>
            </div>
          )}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-canvas"
          >
            <Settings size={16} className="text-muted" />
            Settings
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink hover:bg-canvas"
          >
            <LogOut size={16} className="text-muted" />
            Log out
          </a>
        </div>
      )}
    </div>
  );
}
