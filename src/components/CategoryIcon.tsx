import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  BookOpen,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Gift,
  Repeat,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  bag: ShoppingBag,
  bolt: Zap,
  film: Film,
  heart: HeartPulse,
  book: BookOpen,
  dots: MoreHorizontal,
  briefcase: Briefcase,
  laptop: Laptop,
  store: Store,
  "trending-up": TrendingUp,
  gift: Gift,
  repeat: Repeat,
};

export default function CategoryIcon({
  icon,
  color,
  size = 18,
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  const Icon = ICON_MAP[icon] ?? MoreHorizontal;
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <Icon size={size} strokeWidth={2.25} />
    </div>
  );
}
