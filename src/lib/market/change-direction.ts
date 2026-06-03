/** Daily % move presentation: up / down / flat (unchanged). */
export type PriceDirection = "up" | "down" | "flat";

const FLAT_THRESHOLD_PCT = 0.05;

export function directionFromChangePct(pct: number): PriceDirection {
  if (!Number.isFinite(pct) || Math.abs(pct) < FLAT_THRESHOLD_PCT) {
    return "flat";
  }
  return pct > 0 ? "up" : "down";
}

export function formatChangePct(pct: number): string {
  const direction = directionFromChangePct(pct);
  if (direction === "flat") return "0.0%";
  const sign = direction === "up" ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Infer direction from a formatted change string (watchlist / persisted UI). */
export function directionFromChangeString(change: string): PriceDirection {
  const trimmed = change.trim();
  if (
    trimmed === "0.0%" ||
    trimmed === "+0.0%" ||
    trimmed === "-0.0%" ||
    trimmed === "—"
  ) {
    return "flat";
  }
  if (trimmed.startsWith("+")) return "up";
  if (trimmed.startsWith("-")) return "down";
  const parsed = Number.parseFloat(trimmed.replace("%", ""));
  if (!Number.isNaN(parsed)) return directionFromChangePct(parsed);
  return "flat";
}

export function isUpDirection(direction: PriceDirection): boolean {
  return direction === "up";
}
