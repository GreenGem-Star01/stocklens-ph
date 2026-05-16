import type {
  FeaturedStock,
  PseiDataPoint,
  RecentAnalysisRow,
} from "@/lib/types/stock";

export const pseiData: PseiDataPoint[] = [
  { date: "May 9", value: 6420 },
  { date: "May 10", value: 6435 },
  { date: "May 11", value: 6410 },
  { date: "May 12", value: 6455 },
  { date: "May 13", value: 6470 },
  { date: "May 14", value: 6445 },
  { date: "May 15", value: 6460 },
  { date: "May 16", value: 6480 },
];

export const featuredStocks: FeaturedStock[] = [
  {
    ticker: "BDO.PS",
    name: "BDO Unibank",
    price: "₱138.50",
    change: "+2.3%",
    positive: true,
    sector: "Financials",
    trend: "Projected Upward",
  },
  {
    ticker: "JFC.PS",
    name: "Jollibee Foods",
    price: "₱242.00",
    change: "+1.8%",
    positive: true,
    sector: "Consumer",
    trend: "Projected Upward",
  },
  {
    ticker: "ALI.PS",
    name: "Ayala Land",
    price: "₱32.15",
    change: "-0.5%",
    positive: false,
    sector: "Real Estate",
    trend: "Projected Downward",
  },
  {
    ticker: "TEL.PS",
    name: "PLDT Inc.",
    price: "₱1,285.00",
    change: "+0.9%",
    positive: true,
    sector: "Telecom",
    trend: "Mixed Signal",
  },
  {
    ticker: "SMPH.PS",
    name: "SM Prime",
    price: "₱28.90",
    change: "+1.2%",
    positive: true,
    sector: "Real Estate",
    trend: "Projected Upward",
  },
  {
    ticker: "PSEI.PS",
    name: "PSEi Index",
    price: "6,480",
    change: "+0.3%",
    positive: true,
    sector: "Index",
    trend: "Projected Upward",
  },
];

export const recentAnalysis: RecentAnalysisRow[] = [
  {
    ticker: "BDO.PS",
    company: "BDO Unibank",
    close: "₱138.50",
    trend: "Projected Upward",
    updated: "2026-05-16 14:30",
  },
  {
    ticker: "JFC.PS",
    company: "Jollibee Foods",
    close: "₱242.00",
    trend: "Projected Upward",
    updated: "2026-05-16 14:15",
  },
  {
    ticker: "ALI.PS",
    company: "Ayala Land",
    close: "₱32.15",
    trend: "Projected Downward",
    updated: "2026-05-16 14:00",
  },
  {
    ticker: "TEL.PS",
    company: "PLDT Inc.",
    close: "₱1,285.00",
    trend: "Mixed Signal",
    updated: "2026-05-16 13:45",
  },
  {
    ticker: "SMPH.PS",
    company: "SM Prime",
    close: "₱28.90",
    trend: "Projected Upward",
    updated: "2026-05-16 13:30",
  },
];

export const marketOverview = {
  pseiValue: "6,480",
  pseiChange: "+0.3%",
  topGainer: { ticker: "BDO.PS", change: "+2.3%" },
  topLoser: { ticker: "ALI.PS", change: "-0.5%" },
  marketStatus: "Open",
  marketCloseNote: "Closes at 3:30 PM",
};
