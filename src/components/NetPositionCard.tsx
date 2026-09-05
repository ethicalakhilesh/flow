"use client";

import { useState } from "react";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import type { NetPosition } from "@/lib/finance";
import { formatCurrency } from "@/lib/finance";

export default function NetPositionCard({
  position,
  changePercent,
}: {
  position: NetPosition;
  changePercent?: number;
}) {
  const [hidden, setHidden] = useState(false);

  const display = (amount: number) => (hidden ? "••••••" : formatCurrency(amount));

  return (
    <div className="mb-4 rounded-xl2 border border-border bg-surface p-5 shadow-card">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-muted">Total Net Position</span>
        <button
          onClick={() => setHidden((h) => !h)}
          className="text-muted"
          aria-label={hidden ? "Show balances" : "Hide balances"}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="font-display text-3xl font-bold text-ink">{display(position.net)}</div>

      {typeof changePercent === "number" && (
        <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${changePercent >= 0 ? "text-income" : "text-expense"}`}>
          <TrendingUp size={13} />
          {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent)}% vs last month
        </div>
      )}

      <div className="mt-4 flex divide-x divide-border border-t border-border pt-3">
        <div className="flex-1">
          <div className="text-xs text-muted">Assets</div>
          <div className="text-base font-semibold text-ink">{display(position.assets)}</div>
        </div>
        <div className="flex-1 pl-4">
          <div className="text-xs text-muted">Liabilities</div>
          <div className="text-base font-semibold text-expense">
            {hidden ? "••••••" : formatCurrency(position.liabilities)}
          </div>
        </div>
      </div>
    </div>
  );
}
