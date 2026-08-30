import { Plus } from "lucide-react";
import { getLoyaltyPrograms } from "@/lib/loyalty";
import { groupByCategory, CATEGORY_LABEL, isExpiringSoon } from "@/lib/loyalty";
import LoyaltyCard from "@/components/LoyaltyCard";
import type { LoyaltyCategory } from "@/lib/types";

const CATEGORY_ORDER: LoyaltyCategory[] = ["airline", "hotel", "other"];

export default function MembershipsPage() {
  const programs = getLoyaltyPrograms();
  const grouped = groupByCategory(programs);
  const expiringCount = programs.filter((p) => isExpiringSoon(p.expiry_date)).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Memberships</h1>
          <p className="text-sm text-muted">
            Airline miles, hotel points, and other loyalty programs
          </p>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
          <Plus size={18} />
        </button>
      </div>

      {expiringCount > 0 && (
        <div className="mb-4 rounded-xl2 border border-warn/30 bg-warn/10 px-4 py-2.5 text-sm text-warn">
          {expiringCount} {expiringCount === 1 ? "program has" : "programs have"} points or
          status expiring within 90 days.
        </div>
      )}

      {programs.length === 0 ? (
        <div className="rounded-xl2 border border-border bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-muted">
            No memberships added yet. Add your airline, hotel, or other loyalty programs to
            track balances and expiry dates in one place.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORY_ORDER.map((category) => {
            const items = grouped[category];
            if (items.length === 0) return null;
            return (
              <div
                key={category}
                className="rounded-xl2 border border-border bg-surface p-2 shadow-card"
              >
                <div className="px-2 pt-2 text-sm font-semibold text-ink">
                  {CATEGORY_LABEL[category]}
                </div>
                <div className="divide-y divide-border px-2">
                  {items.map((program) => (
                    <LoyaltyCard key={program.id} program={program} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
