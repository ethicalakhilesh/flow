"use client";

import type { CategoryBreakdownItem } from "@/lib/finance";
import { formatCurrency } from "@/lib/finance";

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryDonut({
  items,
  total,
}: {
  items: CategoryBreakdownItem[];
  total: number;
}) {
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#EDF1F0"
            strokeWidth={STROKE}
          />
          {items.map((item) => {
            const length = (item.percent / 100) * CIRCUMFERENCE;
            const dasharray = `${length} ${CIRCUMFERENCE - length}`;
            const dashoffset = -offset;
            offset += length;
            return (
              <circle
                key={item.category.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={item.category.color}
                strokeWidth={STROKE}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted">Total</span>
          <span className="font-display text-base font-bold text-ink">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="w-full space-y-2.5">
        {items.map((item) => (
          <div key={item.category.id} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.category.color }}
            />
            <span className="flex-1 text-ink">{item.category.name}</span>
            <span className="text-muted">{item.percent}%</span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted">No spending recorded for this period.</p>
        )}
      </div>
    </div>
  );
}
