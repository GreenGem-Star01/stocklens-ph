import type { PseiDataPoint, RecentAnalysisRow } from "@/lib/types/stock";

export { featuredStocks } from "@/lib/data/dashboard-featured";

/** Demo fallback when DB bars are unavailable (approximate PSEi EOD levels). */
export const pseiData: PseiDataPoint[] = [
  { date: "May 9", value: 5862 },
  { date: "May 10", value: 5875 },
  { date: "May 11", value: 5858 },
  { date: "May 12", value: 5888 },
  { date: "May 13", value: 5901 },
  { date: "May 14", value: 5880 },
  { date: "May 15", value: 5890 },
  { date: "May 16", value: 5890 },
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
  pseiValue: "5,893",
  pseiChange: "+0.1%",
  topGainer: { ticker: "BDO.PS", change: "+2.3%" },
  topLoser: { ticker: "ALI.PS", change: "-0.5%" },
  marketStatus: "Open",
  marketCloseNote: "Closes at 3:30 PM",
};
