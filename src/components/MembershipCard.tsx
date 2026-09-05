import type { LoyaltyCategory } from "@/lib/types";
import type { LoyaltyProgramWithBalance } from "@/lib/loyalty";
import { formatPoints, formatMemberId } from "@/lib/loyalty";
import { getLoyaltyIconUrl, DEFAULT_LOYALTY_ICON_BY_CATEGORY } from "@/lib/loyaltyIcons";
import BrandLogo from "./BrandLogo";

/** Distinct gradient per category so cards read apart from one another at a glance. */
const CARD_GRADIENT: Record<LoyaltyCategory, string> = {
  airline: "linear-gradient(135deg, #0A5C50 0%, #0E7C6B 45%, #2E9E8F 100%)",
  hotel: "linear-gradient(135deg, #3B1F4D 0%, #6B3F82 45%, #8C5FA8 100%)",
  other: "linear-gradient(135deg, #1F2937 0%, #374151 45%, #4B5563 100%)",
};

export default function MembershipCard({ program }: { program: LoyaltyProgramWithBalance }) {
  const iconUrl = getLoyaltyIconUrl(program.brand, program.category);

  return (
    <div
      className="relative mb-4 aspect-[1.586/1] w-full overflow-hidden rounded-xl2 p-5 text-white shadow-card"
      style={{ background: CARD_GRADIENT[program.category] }}
    >
      {/* Decorative background ring, purely visual */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-2 -top-2 h-28 w-28 rounded-full border border-white/10" />

      <div className="relative flex h-full flex-col justify-between">
        {/* Top row: logo + tier */}
        <div className="flex items-start justify-between">
          <div className="rounded-[22%] bg-white/15 p-1">
            <BrandLogo
              src={iconUrl}
              fallbackSrc={DEFAULT_LOYALTY_ICON_BY_CATEGORY[program.category]}
              size={36}
            />
          </div>
          {program.tier && (
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
              {program.tier}
            </span>
          )}
        </div>

        {/* Brand + program name */}
        <div>
          <div className="truncate font-display text-lg font-bold leading-tight">{program.brand}</div>
          <div className="truncate text-xs text-white/70">{program.program_name}</div>
        </div>

        {/* Member ID, styled like an embossed card number */}
        {program.member_id && (
          <div className="font-mono text-sm tracking-[0.15em] text-white/90">
            {formatMemberId(program.member_id)}
          </div>
        )}

        {/* Balance */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-white/60">Balance</div>
            <div className="font-display text-xl font-bold">
              {formatPoints(program.points_balance)}{" "}
              <span className="text-sm font-semibold text-white/80">{program.points_name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
