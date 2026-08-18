"use client";

import { useMemo } from "react";
import type { TrendPoint } from "@/lib/finance";
import { formatShortDate } from "@/lib/finance";

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  const { incomePath, expensePath, maxVal } = useMemo(() => {
    const width = 600;
    const height = 180;
    const padding = 8;
    const maxVal = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));

    const toXY = (value: number, index: number) => {
      const x = padding + (index / Math.max(1, data.length - 1)) * (width - padding * 2);
      const y = height - padding - (value / maxVal) * (height - padding * 2);
      return [x, y];
    };

    const buildPath = (key: "income" | "expense") =>
      data
        .map((d, i) => {
          const [x, y] = toXY(d[key], i);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    return {
      incomePath: buildPath("income"),
      expensePath: buildPath("expense"),
      maxVal,
    };
  }, [data]);

  const firstLabel = data[0]?.date;
  const midLabel = data[Math.floor(data.length / 2)]?.date;
  const lastLabel = data[data.length - 1]?.date;

  return (
    <div>
      <svg viewBox="0 0 600 180" className="h-40 w-full" preserveAspectRatio="none">
        <path d={incomePath} fill="none" stroke="#0E7C6B" strokeWidth={2.5} />
        <path d={expensePath} fill="none" stroke="#C4573E" strokeWidth={2.5} />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{firstLabel && formatShortDate(firstLabel)}</span>
        <span>{midLabel && formatShortDate(midLabel)}</span>
        <span>{lastLabel && formatShortDate(lastLabel)}</span>
      </div>
    </div>
  );
}
