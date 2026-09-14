import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { getLoyaltyIconUrl, DEFAULT_LOYALTY_ICON_BY_CATEGORY } from "@/lib/loyaltyIcons";
import { isExpiringSoon, formatExpiry, formatPoints } from "@/lib/loyalty";
import type { LoyaltyProgramWithBalance } from "@/lib/loyalty";
import BrandLogo from "./BrandLogo";

export default function LoyaltyCard({ program }: { program: LoyaltyProgramWithBalance }) {
  const iconUrl = getLoyaltyIconUrl(program.brand, program.category);
  const expiring = isExpiringSoon(program.expiry_date);
  const expiryLabel = formatExpiry(program.expiry_date);

  return (
    <Link
      href={`/memberships/${program.id}`}
      className="flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg transition-colors hover:bg-canvas"
    >
      <BrandLogo
        src={iconUrl}
        fallbackSrc={DEFAULT_LOYALTY_ICON_BY_CATEGORY[program.category]}
        size={40}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{program.brand}</div>
        <div className="truncate text-xs text-muted">
          {program.program_name}
          {program.tier ? ` · ${program.tier}` : ""}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-base font-bold text-ink">{formatPoints(program.points_balance)}</div>
        <div className="text-xs text-muted">{program.points_name}</div>
      </div>
      {expiryLabel && (
        <div
          className={`ml-1 flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
            expiring ? "bg-warn/10 text-warn" : "bg-canvas text-muted"
          }`}
        >
          {expiring && <AlertTriangle size={11} />}
          {expiryLabel}
        </div>
      )}
      <ChevronRight size={16} className="ml-0.5 shrink-0 text-muted" />
    </Link>
  );
}
