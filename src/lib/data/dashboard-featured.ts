import type { FeaturedStock } from "@/lib/types/stock";
import type { PriceDirection } from "@/lib/market/change-direction";
import type { ForecastTrend } from "@/lib/types/stock";
import { getOfficialListingLabels } from "@/lib/pse/universe";

type FeaturedSeed = {
  ticker: string;
  name: string;
  price: string;
  change: string;
  direction: PriceDirection;
  /** Fallback when ticker is not in universe (e.g. before sync). */
  sector: string;
  trend: ForecastTrend;
};

function featured(seed: FeaturedSeed): FeaturedStock {
  const official = getOfficialListingLabels(seed.ticker);
  return {
    ticker: seed.ticker,
    name: seed.name,
    price: seed.price,
    change: seed.change,
    direction: seed.direction,
    positive: seed.direction === "up",
    sector: official?.sector ?? seed.sector,
    trend: seed.trend,
  };
}

export const featuredStocks: FeaturedStock[] = [
  featured({
    ticker: "BDO.PS",
    name: "BDO Unibank",
    price: "₱138.50",
    change: "+2.3%",
    direction: "up",
    sector: "Financials",
    trend: "Projected Upward",
  }),
  featured({
    ticker: "JFC.PS",
    name: "Jollibee Foods",
    price: "₱242.00",
    change: "+1.8%",
    direction: "up",
    sector: "Industrial",
    trend: "Projected Upward",
  }),
  featured({
    ticker: "ALI.PS",
    name: "Ayala Land",
    price: "₱32.15",
    change: "-0.5%",
    direction: "down",
    sector: "Property",
    trend: "Projected Downward",
  }),
  featured({
    ticker: "TEL.PS",
    name: "PLDT Inc.",
    price: "₱1,285.00",
    change: "+0.9%",
    direction: "up",
    sector: "Services",
    trend: "Mixed Signal",
  }),
  featured({
    ticker: "SMPH.PS",
    name: "SM Prime",
    price: "₱28.90",
    change: "+1.2%",
    direction: "up",
    sector: "Property",
    trend: "Projected Upward",
  }),
  featured({
    ticker: "PSEI.PS",
    name: "PSEi Index",
    price: "5,893.40",
    change: "+0.1%",
    direction: "up",
    sector: "Index",
    trend: "Projected Upward",
  }),
];
