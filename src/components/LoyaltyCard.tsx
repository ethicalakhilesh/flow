import { AlertTriangle } from "lucide-react";
import type { LoyaltyProgram } from "@/lib/types";
import { getLoyaltyIconUrl, DEFAULT_LOYALTY_ICON_BY_CATEGORY } from "@/lib/loyaltyIcons";
import { isExpiringSoon, formatExpiry } from "@/lib/loyalty";
import BrandLogo from "./BrandLogo";

export default function LoyaltyCard({ program }: { program: LoyaltyProgram }) {
  const iconUrl = getLoyaltyIconUrl(program.name, program.category);
  const expiring = isExpiringSoon(program.expiry_date);
  const expiryLabel = formatExpiry(program.expiry_date);

  return (
    <div className="flex items-center gap-3 py-2.5">
      <BrandLogo
        src={iconUrl}
        fallbackSrc={DEFAULT_LOYALTY_ICON_BY_CATEGORY[program.category]}
        size={40}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{program.name}</div>
        <div className="text-xs text-muted">
          {program.tier ? `${program.tier} · ` : ""}
          {program.member_id ?? "No member ID on file"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-semibold text-ink">
          {program.points_balance.toLocaleString("en-IN")}
        </div>
        <div className="text-xs text-muted">{program.points_unit}</div>
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
    </div>
  );
}
