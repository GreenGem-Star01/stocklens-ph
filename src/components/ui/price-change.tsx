import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import type { PriceDirection } from "@/lib/market/change-direction";
import { directionFromChangeString } from "@/lib/market/change-direction";
import { cn } from "@/lib/utils";

function resolveDirection(
  change: string,
  direction?: PriceDirection,
  positive?: boolean,
): PriceDirection {
  if (direction) return direction;
  if (positive === undefined) return directionFromChangeString(change);
  if (positive) return "up";
  const fromString = directionFromChangeString(change);
  if (fromString === "flat") return "flat";
  return "down";
}

const directionClass: Record<PriceDirection, string> = {
  up: "text-trend-up",
  down: "text-trend-down",
  flat: "text-muted-foreground",
};

export function PriceChange({
  change,
  direction,
  positive,
  className,
}: {
  change: string;
  direction?: PriceDirection;
  /** Legacy; use `direction`. Flat is never treated as up. */
  positive?: boolean;
  className?: string;
}) {
  const resolved = resolveDirection(change, direction, positive);

  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        directionClass[resolved],
        className,
      )}
    >
      {change}
    </span>
  );
}

export function PriceDirectionIcon({
  direction,
  positive,
  className,
}: {
  direction?: PriceDirection;
  positive?: boolean;
  className?: string;
}) {
  const resolved =
    direction ?? (positive ? "up" : positive === false ? "down" : "flat");

  const iconClass = cn("h-5 w-5", directionClass[resolved], className);

  if (resolved === "flat") {
    return <Minus className={iconClass} aria-hidden />;
  }
  return resolved === "up" ? (
    <ArrowUpRight className={iconClass} aria-hidden />
  ) : (
    <ArrowDownRight className={iconClass} aria-hidden />
  );
}
