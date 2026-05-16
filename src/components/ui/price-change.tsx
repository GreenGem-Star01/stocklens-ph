import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function PriceChange({
  change,
  positive,
  className,
}: {
  change: string;
  positive: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        positive ? "text-trend-up" : "text-trend-down",
        className,
      )}
    >
      {change}
    </span>
  );
}

export function PriceDirectionIcon({
  positive,
  className,
}: {
  positive: boolean;
  className?: string;
}) {
  const iconClass = cn(
    "h-5 w-5",
    positive ? "text-trend-up" : "text-trend-down",
    className,
  );
  return positive ? (
    <ArrowUpRight className={iconClass} aria-hidden />
  ) : (
    <ArrowDownRight className={iconClass} aria-hidden />
  );
}
