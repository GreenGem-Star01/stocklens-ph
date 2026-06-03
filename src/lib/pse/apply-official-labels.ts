import { getOfficialListingLabels } from "@/lib/pse/universe";
import type { StockAnalysis } from "@/lib/types/stock-analysis";

export function resolveListingLabels(
  ticker: string,
  fallbackSector: string,
  fallbackSubsector?: string,
): { sector: string; subsector: string } {
  const official = getOfficialListingLabels(ticker);
  if (official) return official;
  return {
    sector: fallbackSector,
    subsector: fallbackSubsector ?? fallbackSector,
  };
}

export function applyOfficialLabelsToAnalysis(
  analysis: StockAnalysis,
): StockAnalysis {
  const labels = resolveListingLabels(
    analysis.info.ticker,
    analysis.info.sector,
    analysis.info.subsector,
  );
  if (
    labels.sector === analysis.info.sector &&
    labels.subsector === analysis.info.subsector
  ) {
    return analysis;
  }
  return {
    ...analysis,
    info: {
      ...analysis.info,
      sector: labels.sector,
      subsector: labels.subsector,
    },
  };
}
