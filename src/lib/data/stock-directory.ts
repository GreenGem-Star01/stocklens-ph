import { ALL_STOCK_SEEDS, BLUE_CHIP_SEEDS } from "@/lib/data/stock-seeds";
import { getStockAnalysisStatic } from "@/lib/data/stocks";
import { tickerToPath } from "@/lib/forecast";
import type { ForecastTrend } from "@/lib/types/stock";

export type StockDirectoryKind = "equity" | "index";

export type StockDirectoryEntry = {
  ticker: string;
  name: string;
  sector: string;
  path: string;
  kind: StockDirectoryKind;
  lastClose: string;
  dailyChange: string;
  positive: boolean;
  trend: ForecastTrend;
};

export function getStockDirectoryEntries(): StockDirectoryEntry[] {
  return ALL_STOCK_SEEDS.map((seed) => {
    const analysis = getStockAnalysisStatic(seed.ticker);
    if (!analysis) {
      throw new Error(`Missing analysis for ${seed.ticker}`);
    }
    return {
      ticker: seed.ticker,
      name: seed.shortName,
      sector: seed.sector,
      path: tickerToPath(seed.ticker),
      kind: seed.sector === "Index" ? "index" : "equity",
      lastClose: analysis.metrics.lastClose,
      dailyChange: analysis.metrics.dailyChange,
      positive: analysis.metrics.dailyChangePositive,
      trend: analysis.trend,
    };
  });
}

export function getEquityDirectoryCount(): number {
  return BLUE_CHIP_SEEDS.length;
}

export function getDirectorySectors(entries: StockDirectoryEntry[]): string[] {
  const sectors = new Set(entries.map((e) => e.sector));
  return Array.from(sectors).sort((a, b) => a.localeCompare(b));
}

export function filterStockDirectory(
  entries: StockDirectoryEntry[],
  query: string,
  sector: string,
): StockDirectoryEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    const matchesSector = sector === "all" || entry.sector === sector;
    if (!matchesSector) return false;
    if (!q) return true;
    return (
      entry.ticker.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q) ||
      entry.sector.toLowerCase().includes(q) ||
      entry.path.includes(q)
    );
  });
}
