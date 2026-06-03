import type { StockDirectoryEntry } from "@/lib/data/stock-directory";

export type DirectorySortKey = "ticker" | "change" | "price";
export type DirectoryTierFilter = "all" | "hasPrice" | "analyzed" | "catalog";
export type DirectoryKindFilter = "all" | "equity" | "etf" | "index";

export function buildSectorCounts(
  entries: StockDirectoryEntry[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    counts[entry.sector] = (counts[entry.sector] ?? 0) + 1;
  }
  return counts;
}

export function filterDirectoryByTier(
  entries: StockDirectoryEntry[],
  tier: DirectoryTierFilter,
): StockDirectoryEntry[] {
  switch (tier) {
    case "hasPrice":
      return entries.filter((e) => e.lastClose !== "—");
    case "analyzed":
      return entries.filter((e) => e.hasAnalysis);
    case "catalog":
      return entries.filter((e) => !e.hasAnalysis);
    default:
      return entries;
  }
}

export function filterDirectoryByKind(
  entries: StockDirectoryEntry[],
  kind: DirectoryKindFilter,
): StockDirectoryEntry[] {
  if (kind === "all") return entries;
  return entries.filter((e) => e.kind === kind);
}

export function sortDirectoryEntries(
  entries: StockDirectoryEntry[],
  sortKey: DirectorySortKey,
): StockDirectoryEntry[] {
  const sorted = [...entries];
  sorted.sort((a, b) => {
    switch (sortKey) {
      case "change":
        return (b.changePctNum ?? -Infinity) - (a.changePctNum ?? -Infinity);
      case "price":
        return (b.lastCloseNum ?? -Infinity) - (a.lastCloseNum ?? -Infinity);
      case "ticker":
      default:
        return a.ticker.localeCompare(b.ticker);
    }
  });
  return sorted;
}
