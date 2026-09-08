import type { LoyaltyProgramWithBalance } from "@/lib/loyalty";
import { formatPoints, formatMemberId } from "@/lib/loyalty";
import { getLoyaltyIconUrl, DEFAULT_LOYALTY_ICON_BY_CATEGORY } from "@/lib/loyaltyIcons";
import { buildCardGradient } from "@/lib/color";
import BrandLogo from "./BrandLogo";

/** Used only if a program has no card_color set in its data. */
const FALLBACK_CARD_COLOR = "#0E7C6B";

export default function MembershipCard({ program }: { program: LoyaltyProgramWithBalance }) {
  const iconUrl = getLoyaltyIconUrl(program.brand, program.category);
  const gradient = buildCardGradient(program.card_color ?? FALLBACK_CARD_COLOR);

  return (
    <div
      className="relative mb-4 w-full overflow-hidden rounded-xl2 p-5 text-white shadow-card"
      style={{ aspectRatio: "1.586 / 1", background: gradient }}
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
