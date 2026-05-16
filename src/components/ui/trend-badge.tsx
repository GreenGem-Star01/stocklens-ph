import { Badge } from "@/components/ui/badge";
import type { ForecastTrend } from "@/lib/types/stock";
import { cn } from "@/lib/utils";

const trendClassName: Record<ForecastTrend, string> = {
  "Projected Upward":
    "border-trend-up/40 bg-trend-up/15 text-trend-up hover:bg-trend-up/20",
  "Projected Downward":
    "border-trend-down/40 bg-trend-down/15 text-trend-down hover:bg-trend-down/20",
  "Mixed Signal":
    "border-trend-mixed/45 bg-trend-mixed/20 text-trend-mixed hover:bg-trend-mixed/25",
};

export function TrendBadge({
  trend,
  className,
}: {
  trend: ForecastTrend;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(trendClassName[trend], className)}
    >
      {trend}
    </Badge>
  );
}
