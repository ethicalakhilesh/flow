"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MonthOption } from "@/lib/finance";

export default function MonthSelector({
  options,
  value,
  onChange,
}: {
  options: MonthOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.key === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (options.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink"
      >
        {selected?.label ?? "Select month"}
        <ChevronDown size={15} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 max-h-64 w-44 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-card">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${
                o.key === value ? "bg-brand-light font-medium text-brand-dark" : "text-ink hover:bg-canvas"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
